# PostHog integration

The optional browser SDK is loaded after hydration in production only. Without
both `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST`, it does
not initialize or send events. Development traffic stays disabled.

## Project setup (before the next deployment)

1. Create a Hotelia project in PostHog Cloud.
2. Copy its **project token** and ingestion/API host from project settings.
   Use the host supplied for the project's region; do not use the dashboard URL
   or a personal API key.
3. Set both variables in Coolify for `hotelia-next`, available **during build**.
   The Dockerfile accepts them as optional build arguments. They are public
   browser configuration, not server credentials.
4. Include the integration in the next planned commit/push/deployment. Rebuild
   when either value changes; restarting an existing image cannot update them.
5. Open the production home page, then navigate to Stays. Confirm `$pageview`
   events in PostHog. Account, booking, owner, admin and support pages must not
   generate events. Check URLs contain no query strings or fragments.

## Initial capture scope

Only explicit anonymous `$pageview` events from the public route allowlist are
sent. Initial load and Pages Router navigation are tracked without automatic
pageview capture. We do not send member IDs, emails, input values, chat messages,
search queries, referrers or campaign parameters. Person profile processing,
autocapture, session replay, exception capture, performance capture, surveys and
feature flags are disabled. `before_send` rejects all non-pageview events and
private-route events, including changes made remotely in the project settings.

Replay masking is prepared (all inputs/text masked, chat and hidden/file inputs
blocked, no console/network recording), but replay is deliberately disabled.
Enable replay and error tracking in a separate change after reviewing masking,
private-route navigation, consent requirements, retention and usage limits.
Do not simply toggle replay on in the dashboard and assume the app permits it.

The SDK is optional: import/analytics failures must not interrupt browsing.
No backend database or authentication changes are needed.

Validation: `node --test scripts/tests/posthog-privacy.test.cjs`,
`npm run typecheck`, `npm run build`. Live ingestion requires the project setup
and a deployment; it cannot be confirmed while the token is absent.
