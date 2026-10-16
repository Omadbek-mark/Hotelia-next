import type { PostHogConfig } from 'posthog-js';

// Track public browsing only. Account, booking, owner, admin and support pages
// can contain personal data and intentionally stay outside analytics.
const publicPaths = new Set([
	'/',
	'/hotel',
	'/hotel/detail',
	'/hotel-owner',
	'/hotel-owner/detail',
	'/journal',
	'/about',
]);

export function analyticsPath(url: string): string | null {
	try {
		const path = new URL(url, 'https://hotelia.uz').pathname.replace(/\/$/, '') || '/';
		const withoutLocale = path.replace(/^\/(en|ru|uz|kr)(?=\/|$)/, '') || '/';
		return publicPaths.has(withoutLocale) ? path : null;
	} catch {
		return null;
	}
}

export function analyticsConfig(origin: string, currentUrl: () => string): Partial<PostHogConfig> {
	return {
		capture_pageview: false,
		capture_pageleave: false,
		autocapture: false,
		capture_dead_clicks: false,
		capture_exceptions: false,
		capture_performance: false,
		person_profiles: 'never',
		save_referrer: false,
		save_campaign_params: false,
		disable_surveys: true,
		advanced_disable_feature_flags: true,
		// Enable replay separately after reviewing project privacy/retention settings.
		disable_session_recording: true,
		enable_recording_console_log: false,
		session_recording: {
			maskAllInputs: true,
			maskTextSelector: '*',
			blockSelector: '.h-chat, [data-posthog-private], input[type="hidden"], input[type="file"]',
			recordHeaders: false,
			recordBody: false,
			maskCapturedNetworkRequestFn: () => null,
		},
		property_denylist: ['$initial_current_url', '$initial_referrer', '$initial_referring_domain'],
		before_send: (event) => {
			// An explicit allowlist also prevents remote project settings from enabling
			// unexpected events or sending private routes/query strings.
			if (!event || event.event !== '$pageview' || !analyticsPath(currentUrl())) return null;
			const path = analyticsPath(String(event.properties.$current_url ?? ''));
			if (!path) return null;
			event.properties.$current_url = `${origin}${path}`;
			event.properties.$pathname = path;
			delete event.properties.$referrer;
			delete event.properties.$set;
			delete event.properties.$set_once;
			return event;
		},
	};
}
