# Hotelia live chat

Nestar reference inspected: `/Users/omadbek/Projects/nestar-next/libs/components/Chat.tsx`, `apollo/client.ts`, and the home/basic/full layout mounts. Its shared live room uses WebSocket events `info`, `getMessages`, and `message`, online counts, history, left/right bubbles and Enter/send controls.

Hotelia retains that interaction through `libs/components/common/PublicChat.tsx`, mounted once in `pages/_app.tsx`. Route changes therefore retain the open panel, draft, history and connection. The existing Hotelia assistant remains a separate tab and retains its GraphQL integration.

## Existing backend contract

The Hotelia API uses Nest's `WsAdapter`, not Socket.IO or a GraphQL subscription transport. The frontend connects with a native WebSocket. Endpoint precedence is `NEXT_PUBLIC_API_WS`, `REACT_APP_API_WS`, then the API base URL converted to `ws:` or `wss:` (local default `ws://localhost:3021`). No login token or member details are sent by the community chat.

| Direction | Packet | Meaning |
| --- | --- | --- |
| Client → API | `{event: "message", data: "text"}` | Submit a trimmed message, up to 1000 characters |
| API → Client | `{event: "getMessages", clientId, list}` | Connection identity and recent history |
| API → Client | `{event: "info", totalClients}` | Active connection count |
| API → Client | `{event: "message", id, clientId, text, createdAt}` | Confirmed message broadcast, including sender echo |
| API → Client | `{event: "error", code, message, retryAfterMs?}` | Invalid input or rate limit |

Backend reference: `apps/hotelia-api/src/socket/socket.gateway.ts`. Identity is anonymous and connection-scoped. This is a public room, not a private guest/owner conversation. The existing server retains only the last five accepted messages in memory and enforces a two-second per-connection send interval. No database history or new backend logic was added.

The frontend restores unconfirmed drafts on errors/disconnection or a ten-second confirmation timeout, does not automatically resend them, reconnects after two seconds, deduplicates message IDs, caps its local message list and unread badge, and disposes sockets/timers on unmount. Escape closes the panel and returns keyboard focus to the launcher; clicking outside the panel/launcher also closes it. Both tabs, statuses and new lounge labels use EN/RU/UZ translations.

Guest and signed-in members now have separate frontend identity scopes. Login/logout/account switches reconnect the anonymous backend transport; known connection IDs are grouped by the current local identity so reconnects retain own bubbles while messages from another identity stay on the left. Up to 64 connection IDs per identity are retained in tab session storage, preserving attribution on reload without storing message text or tokens. The backend still sends no authenticated member identity, so attribution applies within this browser tab, not across devices. Session changes clear the draft and send cooldown. Logout initiates navigation directly to `/` while retaining existing credential/cache cleanup and server logout.

Validation: mocked UI transport tests cover server-confirmed bubbles, duplicate packets/submissions, malformed history, online/unread state, Escape focus, failed-message draft restoration, reconnect identity and cleanup. Real local API verification received `getMessages` and `info` without broadcasting a test message.
