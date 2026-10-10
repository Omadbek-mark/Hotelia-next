# Hotelia frontend architecture

## Reference and boundaries

The refactor studies the sibling `nestar-next` repository without modifying it. Its useful pattern is a Pages Router entry layer, page-oriented component folders under `libs/components`, shared layouts/common components, hooks, domain types/enums, Apollo operations, and SCSS. Hotelia adopts those boundaries rather than the inherited real-estate implementation.

Canonical routes use Hotelia domain names: `/hotel`, `/hotel-owner`, `/journal` and `/account`. Legacy bookmarks redirect to them. Home, catalog, hotel detail, sign-in and account route files now delegate to their feature components. Existing Next.js translation exports stay in route files. UI state belongs to its feature component; validation, session handling, upload transport and shared cache refresh live outside UI components.

## Component ownership

| Folder | Responsibility |
| --- | --- |
| `homepage` | Home page, discovery hotel sections, featured hosts |
| `hotel` | Hotel catalog, catalog filters, hotel detail, search and availability forms |
| `booking` | Booking request/review dialogs and trip cards |
| `owner`, `member` | Host directory and public member profiles |
| `account` | Account routing, profile, trips, saved/recent stays and connections |
| `journal` | Journal list, detail, comments and article editor |
| `owner` | Workspace routing, overview, hotel/room inventory, separate editors and reservations |
| `account` | Sign-in and registration screen |
| `layout`, `common` | Public/account/dashboard layouts and shared UI |
| `about`, `support`, `admin` | Hotelia information, support and administration feature screens |

Owner editor fields are shared in `EditorFields.tsx`. Inventory status/actions are shared in `InventoryControls.tsx`. `useOwnerRefresh` lives in `libs/hooks` and invalidates public inventory plus active owner queries. `useViewerRefresh` reloads viewer-dependent social data after session changes. No `libs/components/hotelia` aggregation folder remains.

## Contracts and operations

`npm run contracts:sync` generates 84 interfaces and 24 enums from the sibling Hotelia API. Types live in domain folders such as `hotel`, `room`, `booking`, `member` and `board-article`. Domain enum files live in `libs/enums`. Export barrels provide stable imports; inter-domain references use type-only imports. `SessionMember` is the client session state, populated from the authenticated member response rather than JWT claims.

Apollo user operations live in `apollo/user`; owner operations live in `apollo/owner`; administration operations live in `apollo/admin`. Authentication transport remains in `apollo/client.ts`, and the reactive session remains in `apollo/store.ts`. Obsolete real-estate GraphQL operations and duplicate legacy DTOs have been removed.

## Styles, assets and cleanup

Responsive Hotelia styles are split by feature and imported in their previous cascade order through `scss/main.scss`. The inherited desktop/mobile Nestar styles, property cards/filters, legacy account/member panels, 3D demo components, rich-text editor wrappers, unused images/video, logos and template changelog are removed. The package name is `hotelia-next`; unused dependency declarations and their lockfile graph are pruned. Both development and production scripts use port 3015.

Only tracked unused files in Hotelia-next are removed. Backend files, design gallery artifacts, environment configuration and user-created untracked artifacts are outside this cleanup.

## Support and administration

Support/backend integration completed in stage 12: FAQ, public notices, private inquiries, notifications and recovery screens use Hotelia components and contracts. Stage 13 connects administration through separate overview, hotel, room, reservation, member, journal and support components. DashboardLayout waits for session restoration and an active ADMIN role before mounting queries. Filters and pagination live in the URL; unsupported URL values do not reach the API. Status changes and cancellation use confirmation dialogs; support editors review publication/reply visibility before saving. No administrator-promotion or permanent-removal UI is exposed. Admin support publishes only public categories and replies only to private inquiries, with revision checks for concurrent editing.

## Verification

Run `npm test`, `npm run typecheck` and `npm run build`. UI tests import the reorganized production components and use isolated Apollo fixtures; no live records are created. Contract generation must be repeatable without changing generated output.

## Hotelia naming and URLs

Public hotel-owner discovery (`/hotel-owner`, `/hotel-owner/detail?ownerId=…`) and the private owner workspace (`/owner`) describe the same HOTEL_OWNER member role. They share the owner component folder and backend member identity. The public screens expose published hotel/profile information; owner mutations and inventory remain authenticated and scoped to the current owner.

Hotel routes use `/hotel` and `/hotel/detail?hotelId=…`; journal routes use `/journal`; the account route is `/account`; support uses `/support`. Corresponding component/style folders use those domain names. Admin hotel and journal routes use `/_admin/hotels` and `/_admin/journal`. Legacy routes exist only as permanent redirects. They preserve dates, filters and identifiers for previously saved links.

Verification after renaming: 60 frontend tests, TypeScript and production build passed. The availability-form integration test verifies canonical hotelId handling. Live browser checks opened hotel-owner discovery and hotel detail. HTTP redirect checks verified hotel/owner identifier mapping and legacy owner inventory navigation. Backend contracts and generated technical names retain their API meanings.
