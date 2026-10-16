const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
const filename = path.resolve(__dirname, '../../libs/analytics/posthog.ts');
const compiled = new Module(filename, module);
compiled._compile(
	ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
	}).outputText,
	filename,
);
const { analyticsPath, analyticsConfig } = compiled.exports;

test('public routes retain locale but never include query values or fragments', () => {
	assert.equal(analyticsPath('/uz/hotel/detail?hotelId=secret#personal'), '/uz/hotel/detail');
	assert.equal(analyticsPath('/ru/'), '/ru');
	assert.equal(analyticsPath('/hotel/'), '/hotel');
});

test('private and unknown routes are excluded, including localized routes', () => {
	for (const route of [
		'/account',
		'/account/join',
		'/booking',
		'/owner/hotel',
		'/_admin',
		'/support',
		'/member',
		'/uz/account',
		'/new-private-page',
	]) {
		assert.equal(analyticsPath(route), null, route);
	}
});

test('pageviews strip URL query, fragment, referrer and person properties', () => {
	const config = analyticsConfig('https://hotelia.uz', () => 'https://hotelia.uz/hotel?search=private');
	const event = {
		event: '$pageview',
		properties: {
			$current_url: 'https://hotelia.uz/hotel?email=private@example.com#token',
			$referrer: 'https://example.com/?token=private',
			$set: { email: 'private@example.com' },
			$set_once: { email: 'private@example.com' },
		},
	};
	const cleaned = config.before_send(event);
	assert.deepEqual(cleaned.properties, { $current_url: 'https://hotelia.uz/hotel', $pathname: '/hotel' });
});

test('private route events and unexpected automatic capture are blocked', () => {
	const privateConfig = analyticsConfig('https://hotelia.uz', () => 'https://hotelia.uz/account');
	assert.equal(privateConfig.before_send({ event: '$pageview', properties: { $current_url: '/' } }), null);
	const publicConfig = analyticsConfig('https://hotelia.uz', () => 'https://hotelia.uz/');
	for (const event of ['$autocapture', '$snapshot', '$exception', '$identify']) {
		assert.equal(publicConfig.before_send({ event, properties: { $current_url: '/' } }), null);
	}
	assert.equal(publicConfig.before_send({ event: '$pageview', properties: { $current_url: '/account' } }), null);
});
