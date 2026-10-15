const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:3015', pretendToBeVisual: true });
Object.assign(global, {
	window: dom.window,
	self: dom.window,
	document: dom.window.document,
	HTMLElement: dom.window.HTMLElement,
	DocumentFragment: dom.window.DocumentFragment,
	Node: dom.window.Node,
	MutationObserver: dom.window.MutationObserver,
	Event: dom.window.Event,
	sessionStorage: dom.window.sessionStorage,
	getComputedStyle: dom.window.getComputedStyle,
	requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
	cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
	IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
for (const extension of ['.ts', '.tsx'])
	require.extensions[extension] = (module, file) =>
		module._compile(
			ts.transpileModule(fs.readFileSync(file, 'utf8'), {
				compilerOptions: {
					module: ts.ModuleKind.CommonJS,
					target: ts.ScriptTarget.ES2019,
					jsx: ts.JsxEmit.ReactJSX,
					esModuleInterop: true,
				},
			}).outputText,
			file,
		);
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react-dom/test-utils');
const { ApolloProvider, ApolloClient, InMemoryCache } = require('@apollo/client');
const { RouterContext } = require('next/dist/shared/lib/router-context.shared-runtime');
const Chat = require('../../libs/components/common/PublicChat.tsx').default;
const { userVar, anonymousUser } = require('../../apollo/store.ts');
class Socket {
	static OPEN = 1;
	static all = [];
	readyState = 0;
	sent = [];
	constructor(url) {
		this.url = url;
		Socket.all.push(this);
	}
	open() {
		this.readyState = 1;
		this.onopen?.();
	}
	receive(data) {
		this.onmessage?.({ data: typeof data === 'string' ? data : JSON.stringify(data) });
	}
	send(value) {
		this.sent.push(JSON.parse(value));
	}
	close() {
		this.readyState = 3;
		this.onclose?.();
	}
}
global.WebSocket = Socket;
let root, host;
function mount(connectionId = 'mine') {
	host = document.createElement('div');
	document.body.append(host);
	root = createRoot(host);
	act(() =>
		root.render(
			React.createElement(
				RouterContext.Provider,
				{ value: { locale: 'en', pathname: '/' } },
				React.createElement(
					ApolloProvider,
					{ client: new ApolloClient({ cache: new InMemoryCache() }) },
					React.createElement(Chat),
				),
			),
		),
	);
	const ws = Socket.all.at(-1);
	act(() => {
		ws.open();
		ws.receive({ event: 'getMessages', clientId: connectionId, list: [] });
		ws.receive({ event: 'info', totalClients: 2 });
	});
	return ws;
}
function click(selector) {
	act(() => host.querySelector(selector).click());
}
function input(text) {
	act(() => {
		const node = host.querySelector('input');
		Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(node, text);
		node.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
	});
}
function submitTwice() {
	act(() => {
		const form = host.querySelector('form');
		form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
		form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
	});
}
function message(id, clientId, text) {
	return { event: 'message', id, clientId, text, createdAt: '2026-10-11T12:00:00.000Z' };
}
afterEach(() => {
	if (root) act(() => root.unmount());
	host?.remove();
	Socket.all = [];
	userVar({ ...anonymousUser });
	sessionStorage.clear();
});

test('chat uses the backend wire contract, waits for echo and deduplicates confirmed messages', () => {
	const ws = mount();
	assert.match(ws.url, /^ws:\/\/localhost:3021\/?$/);
	click('.h-chat-toggle');
	input('  Hello travelers  ');
	submitTwice();
	assert.deepEqual(ws.sent, [{ event: 'message', data: 'Hello travelers' }]);
	assert.equal(host.querySelectorAll('.h-chat-message').length, 0);
	act(() => {
		ws.receive(message('1', 'mine', 'Hello travelers'));
		ws.receive(message('1', 'mine', 'Hello travelers'));
	});
	assert.equal(host.querySelectorAll('.h-chat-message').length, 1);
	assert.equal(host.querySelector('.h-chat-message--mine p').textContent, 'Hello travelers');
	assert.equal(host.querySelector('time').getAttribute('datetime'), '2026-10-11T12:00:00.000Z');
});

test('chat filters malformed history, updates presence and unread counts, and closes with Escape', () => {
	const ws = mount();
	act(() => {
		ws.receive('invalid json');
		ws.receive({ event: 'getMessages', clientId: 'mine', list: [message('1', 'other', 'Welcome'), { text: 'bad' }] });
		ws.receive({ event: 'info', totalClients: 3 });
		ws.receive(message('2', 'other', 'New message'));
		ws.receive(message('2', 'other', 'New message'));
	});
	assert.equal(host.querySelectorAll('.h-chat-message').length, 2);
	assert.match(host.querySelector('.h-chat-status').textContent, /3 online connections/);
	assert.equal(host.querySelector('.h-chat-unread').textContent, '1');
	click('.h-chat-toggle');
	assert.equal(host.querySelector('.h-chat-unread'), null);
	act(() =>
		host
			.querySelector('input')
			.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
	);
	assert.equal(host.querySelector('.h-chat-panel').hidden, true);
	assert.equal(document.activeElement, host.querySelector('.h-chat-toggle'));
});

test('missing confirmation restores the draft and unmount disposes the socket', () => {
	const ws = mount();
	click('.h-chat-toggle');
	const original = global.setTimeout;
	let expire;
	global.setTimeout = (callback, delay, ...args) => {
		if (delay === 10000) expire = callback;
		return original(callback, delay, ...args);
	};
	try {
		input('Unconfirmed message');
		submitTwice();
		act(() => expire());
		assert.equal(host.querySelector('input').value, 'Unconfirmed message');
		assert.match(host.querySelector('[role="alert"]').textContent, /not confirmed/);
		act(() => root.unmount());
		root = null;
		assert.equal(ws.readyState, 3);
		assert.equal(ws.onmessage, null);
	} finally {
		global.setTimeout = original;
	}
});

test('rejected messages restore the draft and disconnects reconnect with a fresh identity', async () => {
	const ws = mount();
	click('.h-chat-toggle');
	input('Keep this draft');
	submitTwice();
	act(() => ws.receive({ event: 'error', code: 'RATE_LIMITED', retryAfterMs: 1000 }));
	assert.equal(host.querySelector('input').value, 'Keep this draft');
	assert.match(host.querySelector('[role="alert"]').textContent, /two seconds/);
	act(() => ws.close());
	assert.equal(host.querySelector('input').disabled, true);
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 2100));
	});
	const reconnect = Socket.all.at(-1);
	assert.notEqual(reconnect, ws);
	act(() => {
		reconnect.open();
		reconnect.receive({ event: 'getMessages', clientId: 'new-id', list: [message('3', 'mine', 'Old connection')] });
	});
	assert.equal(host.querySelector('input').value, 'Keep this draft');
	assert.equal(host.querySelector('.h-chat-message--mine p').textContent, 'Old connection');
	assert.equal(host.querySelector('[role="alert"]'), null);
});

test('guest and authenticated identities have separate own bubbles; outside click closes the panel', () => {
	const guest = mount();
	click('.h-chat-toggle');
	act(() => guest.receive(message('guest-message', 'mine', 'Guest greeting')));
	assert.equal(host.querySelector('.h-chat-message--mine p').textContent, 'Guest greeting');
	act(() => userVar({ ...anonymousUser, _id: 'member-one' }));
	assert.equal(guest.readyState, 3);
	const member = Socket.all.at(-1);
	act(() => {
		member.open();
		member.receive({
			event: 'getMessages',
			clientId: 'member-connection',
			list: [message('guest-message', 'mine', 'Guest greeting')],
		});
		member.receive(message('member-message', 'member-connection', 'Member greeting'));
		member.receive(message('other-message', 'someone-else', 'Other visitor'));
	});
	const bubbles = [...host.querySelectorAll('.h-chat-message')];
	assert.deepEqual(
		bubbles.map((node) => node.classList.contains('h-chat-message--mine')),
		[false, true, false],
	);
	assert.equal(host.querySelector('.h-chat-toggle span'), null);
	act(() => document.body.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true })));
	assert.equal(host.querySelector('.h-chat-panel').hidden, true);
});

test('logout clears the local identity and routes straight to home', async () => {
	const Router = require('next/router');
	const original = Router.replace;
	const routes = [];
	Router.replace = async (route) => {
		routes.push(route);
		return true;
	};
	try {
		userVar({ ...anonymousUser, _id: 'member-one' });
		await require('../../libs/auth/index.ts').logOut();
		assert.equal(userVar()._id, '');
		assert.deepEqual(routes, ['/']);
	} finally {
		Router.replace = original;
	}
});

test('own connection attribution survives a reload within the same tab', () => {
	const original = mount();
	act(() => original.receive(message('before-reload', 'mine', 'My earlier message')));
	act(() => root.unmount());
	root = null;
	host.remove();
	const reloaded = mount('new-connection');
	act(() =>
		reloaded.receive({
			event: 'getMessages',
			clientId: 'new-connection',
			list: [message('before-reload', 'mine', 'My earlier message'), message('other', 'another', 'Other visitor')],
		}),
	);
	assert.equal(host.querySelector('.h-chat-message--mine p').textContent, 'My earlier message');
	assert.equal(host.querySelectorAll('.h-chat-message--mine').length, 1);
});
