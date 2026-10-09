# Frontend / backend contract map

## Foundation completed

- Baseline and updated production builds pass. Existing Browserslist/i18next warnings remain.
- Browser-safe configuration supports `NEXT_PUBLIC_API_*` and existing `REACT_APP_API_*` variables.
- Apollo uses authenticated HTTP + multipart upload. Backend has no GraphQL subscriptions; the old WebSocket wrapper and placeholder refresh link were removed from transport.
- Access JWT contains only `sub`, `sid`, `type`, `exp` identity claims. Profile and role are loaded from `checkAuth` + `getMember`, never from decoded profile claims.
- Refresh token rotation is deduplicated per tab, with protection against late responses after logout/new login. Temporary network failures preserve retryable credentials.
- Login/signup use backend member fields and token pairs; profile updates no longer expect a new access token. Signup includes required email and optional phone.
- Existing AGENT role checks now use HOTEL_OWNER. Old components temporarily receive `memberProperties = memberHotels` through a documented adapter.
- Shared image upload helper uses backend targets (`member`, `hotel`, `room`, `article`), multipart preflight, current authentication and backend file/count limits. Profile and article uploads use it.
- `scripts/sync-backend-contracts.cjs` generates 62 browser interfaces and 17 enums from GraphQL-decorated backend DTOs. Private fields such as passwords/session hashes are excluded. IDs and timestamps are strings on the wire.

## Migration by feature

| Old frontend concept | Backend contract | Implementation phase |
|---|---|---|
| Property, propertyPrice, barter/rent | Hotel + Room; startingPrice is nullable; roomPrice is nightly USD price | Home, catalog, detail |
| PropertyLocation | hotelCountry, hotelCity, hotelAddress, hotelTimezone | Catalog and owner forms |
| getProperties/getProperty | getHotels/getHotel | Catalog/detail |
| AGENT/getAgents | HOTEL_OWNER/getHotelOwners | Host pages |
| memberProperties | memberHotels | New cards/profile/dashboard |
| JWT carrying member profile | TokenPair + checkAuth/getMember | Foundation completed |
| Property likes | favoriteHotel/unfavoriteHotel/getFavorites | Catalog/saved |
| Generic property comments | Completed-booking hotel reviews through backend comment API | Booking/reviews |
| No reservation UI | BookingInput, getMyBookings, createBooking, cancelBooking | Booking/Trips |
| Property CRUD | createHotel/updateHotel/deleteHotel and room CRUD | Owner dashboard |
| Static owner statistics | getOwnerDashboard, completed-booking revenue in USD | Owner dashboard |
| Property admin | Hotel/room/booking admin queries and mutations | Admin dashboard |

Existing property screens and old public/admin query modules are replaced feature by feature. The foundation commit does not claim that these old property operations work against the Hotelia schema.

## Verification

- `node --test scripts/tests/auth-session.test.cjs`: nine session tests pass.
- `npx tsc --noEmit`: pass.
- `npm run build`: pass.
- Running API at localhost:3021: GraphQL schema validates login, signup, session member, logout, update member, refresh token, single and multiple image uploader operations. This is schema validation; no accounts or bookings were created for verification.

## Saved and recently viewed

- Saved stays use authenticated `getFavorites(FavoritesInquiry)` with `favoriteHotel` / `unfavoriteHotel`. Normalized hotel favorite status and all saved collection page caches are updated/invalidated together.
- Recently viewed uses authenticated `getVisited(VisitedInquiry)` added in stage 8. It reads the existing member HOTEL view records, joins ACTIVE hotels before count/pagination, and orders by updatedAt descending with an ID tie breaker. Repeat hotel visits refresh the view timestamp without incrementing unique hotelViews. Other view groups keep their existing behavior.
- `VisitedInquiry` validates page 1–1000000 and limit 1–100; the member identity comes exclusively from the session. No frontend local history or fabricated timestamps are used. There is no clear-history operation.

## Hosts and public social profiles

- `getHotelOwners(HotelOwnersInquiry)` powers the host directory; supported frontend sorts are memberRank, memberFollowers and createdAt, descending. Nickname search and bounded URL pagination are validated before querying.
- Public profiles use a selected `getMember(memberId)` field set: names, image, bio, role/status, join date, hotel/article/follow counts and meFollowed. The new screens do not query private email, phone, address or tokens. Non-active profiles and non-owner host IDs show unavailable.
- Host stays use `getHotels` with ownerId; authored journal teasers use `getBoardArticles` with memberId. Both use the backend's active/public filters. Reviews and availability remain on hotel detail.
- `getMemberFollowers` / `getMemberFollowings` use FollowInquiry with target IDs and backend MemberPublic projections. `subscribe` / `unsubscribe` changes are followed by fresh active social queries, with double-click protection, self-follow prevention, anonymous referrer and session-specific follow-state refresh.
- Other members' saved stays, messaging, host inquiries, dispatch subscriptions and invitation passes have no applicable backend contracts and are not exposed.
- Backend unchanged in stage 9. Seven new GraphQL documents validate against the live schema; public read queries succeed. 38 frontend tests and 5 existing follow/ranking backend tests pass. No live social mutations were performed for verification.
