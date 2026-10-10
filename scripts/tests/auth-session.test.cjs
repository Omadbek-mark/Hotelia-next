const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) =>
	module._compile(
		ts.transpileModule(fs.readFileSync(file, 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
		}).outputText,
		file,
	);
const { getValidAccessToken, readAccessClaims, clearSession, saveSession } = require('../../libs/auth/session.ts');
const originalFetch = global.fetch;
afterEach(() => {
	global.fetch = originalFetch;
	delete global.window;
});

function browser() {
	const values = new Map();
	global.window = {
		localStorage: {
			getItem: (key) => values.get(key) || null,
			setItem: (key, value) => values.set(key, value),
			removeItem: (key) => values.delete(key),
		},
		dispatchEvent: () => {},
	};
	return window.localStorage;
}
function jwt(seconds) {
	const payload = {
		sub: 'a'.repeat(24),
		sid: 'b'.repeat(24),
		type: 'access',
		exp: Math.floor(Date.now() / 1000) + seconds,
	};
	return `e30.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
}
function response(accessToken, refreshToken) {
	return { ok: true, status: 200, json: async () => ({ data: { refreshToken: { accessToken, refreshToken } } }) };
}

test('server-side calls never access browser storage or refresh', async () => {
	delete global.window;
	global.fetch = () => {
		throw new Error('Unexpected fetch');
	};
	assert.equal(await getValidAccessToken(), '');
});
test('valid access token is reused without a refresh request', async () => {
	browser();
	const token = jwt(900);
	saveSession({ accessToken: token, refreshToken: 'refresh' });
	global.fetch = () => {
		throw new Error('Unexpected refresh');
	};
	assert.equal(await getValidAccessToken(), token);
});
test('parallel requests rotate a near-expiry token only once', async () => {
	const storage = browser();
	saveSession({ accessToken: jwt(5), refreshToken: 'old-refresh' });
	const fresh = jwt(900);
	let calls = 0;
	global.fetch = async (_url, options) => {
		calls++;
		assert.equal(JSON.parse(options.body).variables.token, 'old-refresh');
		return response(fresh, 'rotated-refresh');
	};
	assert.deepEqual(await Promise.all([getValidAccessToken(), getValidAccessToken(), getValidAccessToken()]), [
		fresh,
		fresh,
		fresh,
	]);
	assert.equal(calls, 1);
	assert.equal(storage.getItem('refreshToken'), 'rotated-refresh');
});
test('refresh response cannot resurrect a logged-out session', async () => {
	const storage = browser();
	saveSession({ accessToken: jwt(-10), refreshToken: 'old-refresh' });
	let resolve;
	global.fetch = () =>
		new Promise((done) => {
			resolve = done;
		});
	const pending = getValidAccessToken();
	clearSession();
	resolve(response(jwt(900), 'rotated'));
	assert.equal(await pending, '');
	assert.equal(storage.getItem('refreshToken'), null);
});
test('refresh response cannot overwrite a newer login', async () => {
	const storage = browser();
	saveSession({ accessToken: jwt(-10), refreshToken: 'old-refresh' });
	let resolve;
	global.fetch = () =>
		new Promise((done) => {
			resolve = done;
		});
	const pending = getValidAccessToken();
	const newer = jwt(800);
	saveSession({ accessToken: newer, refreshToken: 'new-login' });
	resolve(response(jwt(900), 'stale-rotation'));
	assert.equal(await pending, newer);
	assert.equal(storage.getItem('refreshToken'), 'new-login');
});
test('temporary network failure preserves refresh credentials for retry', async () => {
	const storage = browser();
	saveSession({ accessToken: jwt(-10), refreshToken: 'retryable' });
	global.fetch = async () => {
		throw new Error('Offline');
	};
	await assert.rejects(getValidAccessToken(), /Offline/);
	assert.equal(storage.getItem('refreshToken'), 'retryable');
	global.fetch = async () => response(jwt(900), 'recovered');
	assert.ok(await getValidAccessToken());
});
test('unauthorized refresh clears credentials even with a non-JSON response', async () => {
	const storage = browser();
	saveSession({ accessToken: jwt(-10), refreshToken: 'revoked' });
	global.fetch = async () => ({
		ok: false,
		status: 401,
		json: () => {
			throw new Error('Non-JSON');
		},
	});
	assert.equal(await getValidAccessToken(), '');
	assert.equal(storage.getItem('accessToken'), null);
});
test('GraphQL unauthorized response also clears credentials', async () => {
	const storage = browser();
	saveSession({ accessToken: jwt(-10), refreshToken: 'revoked' });
	global.fetch = async () => ({
		ok: true,
		status: 200,
		json: async () => ({ errors: [{ message: 'Unauthorized', extensions: { code: 'UNAUTHENTICATED' } }] }),
	});
	assert.equal(await getValidAccessToken(), '');
	assert.equal(storage.getItem('refreshToken'), null);
});
test('old profile-bearing JWTs are not accepted as Hotelia sessions', async () => {
	const storage = browser();
	const old = `e30.${Buffer.from(JSON.stringify({ _id: 'a'.repeat(24), memberType: 'ADMIN' })).toString(
		'base64url',
	)}.signature`;
	assert.equal(readAccessClaims(old), null);
	storage.setItem('accessToken', old);
	assert.equal(await getValidAccessToken(), '');
	assert.equal(storage.getItem('accessToken'), null);
});
