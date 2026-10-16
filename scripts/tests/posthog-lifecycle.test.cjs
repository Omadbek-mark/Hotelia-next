const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://hotelia.uz/' });
Object.assign(global, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
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
const { RouterContext } = require('next/dist/shared/lib/router-context.shared-runtime');
const Analytics = require('../../libs/components/common/PostHogAnalytics.tsx').default;
const originalLoad = Module._load;
const previousEnv = { ...process.env };
let root,
	host,
	loaded = 0,
	events = [],
	listeners = new Map();
const router = {
	isReady: true,
	events: {
		on: (name, fn) => listeners.set(name, fn),
		off: (name, fn) => {
			if (listeners.get(name) === fn) listeners.delete(name);
		},
	},
};
const sdk = {
	init: (_token, config) => {
		loaded++;
		config.loaded();
	},
	capture: (name, props) => events.push({ name, props }),
};
Module._load = function (request, ...args) {
	return request === 'posthog-js' ? sdk : originalLoad.call(this, request, ...args);
};
async function mount() {
	host = document.createElement('div');
	document.body.append(host);
	root = createRoot(host);
	await act(async () => {
		root.render(React.createElement(RouterContext.Provider, { value: router }, React.createElement(Analytics)));
	});
}
afterEach(async () => {
	if (root) await act(async () => root.unmount());
	host?.remove();
	root = null;
	loaded = 0;
	events = [];
	listeners.clear();
	for (const key of ['NODE_ENV', 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN', 'NEXT_PUBLIC_POSTHOG_HOST']) {
		if (previousEnv[key] === undefined) delete process.env[key];
		else process.env[key] = previousEnv[key];
	}
});
test('missing project configuration never initializes analytics', async () => {
	process.env.NODE_ENV = 'production';
	delete process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
	await mount();
	assert.equal(loaded, 0);
	assert.equal(listeners.size, 0);
});
test('configured production captures initial load and navigation once, excludes private pages, and cleans listeners', async () => {
	process.env.NODE_ENV = 'production';
	process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = 'phc_test';
	process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://us.i.posthog.com';
	await mount();
	assert.equal(loaded, 1);
	assert.equal(events.length, 1);
	listeners.get('routeChangeComplete')('/hotel?destination=Tashkent');
	listeners.get('routeChangeComplete')('/account?private=value');
	assert.equal(events.length, 2);
	assert.equal(events[1].props.$current_url, 'https://hotelia.uz/hotel');
	await act(async () => root.unmount());
	root = null;
	assert.equal(listeners.size, 0);
});
test('development remains disabled even with project configuration', async () => {
	process.env.NODE_ENV = 'development';
	process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN = 'phc_test';
	process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://us.i.posthog.com';
	await mount();
	assert.equal(loaded, 0);
});
