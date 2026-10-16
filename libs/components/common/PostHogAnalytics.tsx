import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { analyticsConfig, analyticsPath } from '../../analytics/posthog';

export default function PostHogAnalytics() {
	const router = useRouter();
	useEffect(() => {
		const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
		const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
		if (process.env.NODE_ENV !== 'production' || !token || !host || !router.isReady) return;

		let disposed = false;
		let removeListener: (() => void) | undefined;
		// Load analytics after hydration. A blocked analytics service must not stop the site.
		void import('posthog-js')
			.then(({ default: posthog }) => {
				if (disposed) return;
				posthog.init(token, {
					...analyticsConfig(window.location.origin, () => window.location.href),
					api_host: host,
					loaded: () => {
						if (!disposed) capturePage(window.location.href);
					},
				});
				function capturePage(url: string) {
					const path = analyticsPath(url);
					if (path) posthog.capture('$pageview', { $current_url: `${window.location.origin}${path}` });
				}
				const onRoute = (url: string) => capturePage(url);
				router.events.on('routeChangeComplete', onRoute);
				removeListener = () => router.events.off('routeChangeComplete', onRoute);
			})
			.catch(() => {
				// Analytics is optional; network/ad-blocker failures must not affect browsing.
			});
		return () => {
			disposed = true;
			removeListener?.();
		};
	}, [router.isReady, router.events]);
	return null;
}
