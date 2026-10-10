# Hotelia frontend architecture

## Reference and boundaries

The refactor studies the sibling `nestar-next` repository without modifying it. Its useful pattern is a Pages Router entry layer, page-oriented component folders under `libs/components`, shared layouts/common components, hooks, domain types/enums, Apollo operations, and SCSS. Hotelia adopts those boundaries rather than the inherited real-estate implementation.

Routes keep their existing addresses. Home, catalog, hotel detail, sign-in and account route files now delegate to their feature components. Existing Next.js translation exports stay in route files. UI state belongs to its feature component; validation, session handling, upload transport and shared cache refresh live outside UI components.

## Component ownership

| Folder | Responsibility |
| --- | --- |
| `homepage` | Home page, discovery hotel sections, featured hosts |
| `property` | Hotel catalog, catalog filters, hotel detail, search and availability forms |
| `booking` | Booking request/review dialogs and trip cards |
| `agent`, `member` | Host directory and public member profiles |
| `mypage` | Account routing, profile, trips, saved/recent stays and connections |
| `community` | Journal list, detail, comments and article editor |
| `owner` | Workspace routing, overview, hotel/room inventory, separate editors and reservations |
| `account` | Sign-in and registration screen |
| `layout`, `common` | Public/account/dashboard layouts and shared UI |
| `about`, `cs`, `admin` | Hotelia information and pending support/admin route components |

Owner editor fields are shared in `EditorFields.tsx`. Inventory status/actions are shared in `InventoryControls.tsx`. `useOwnerRefresh` lives in `libs/hooks` and invalidates public inventory plus active owner queries. `useViewerRefresh` reloads viewer-dependent social data after session changes. No `libs/components/hotelia` aggregation folder remains.

## Contracts and operations

`npm run contracts:sync` generates 70 interfaces and 19 enums from the sibling Hotelia API. Types live in domain folders such as `hotel`, `room`, `booking`, `member` and `board-article`. Domain enum files live in `libs/enums`. Export barrels provide stable imports; inter-domain references use type-only imports. `SessionMember` is the client session state, populated from the authenticated member response rather than JWT claims.

Apollo user operations live in `apollo/user`; owner operations live in `apollo/owner`. Authentication transport remains in `apollo/client.ts`, and the reactive session remains in `apollo/store.ts`. Obsolete property/agent GraphQL operations and duplicate legacy DTOs have been removed.

## Styles, assets and cleanup

Responsive Hotelia styles are split by feature and imported in their previous cascade order through `scss/main.scss`. The inherited desktop/mobile Nestar styles, property cards/filters, legacy account/member panels, 3D demo components, rich-text editor wrappers, unused images/video, logos and template changelog are removed. The package name is `hotelia-next`; unused dependency declarations and their lockfile graph are pruned. Both development and production scripts use port 3015.

Only tracked unused files in Hotelia-next are removed. Backend files, design gallery artifacts, environment configuration and user-created untracked artifacts are outside this cleanup.

## Pending routes

The inherited support pages contained property-trading demo copy; inherited administration used incompatible real-estate queries and demo tables. Their URLs remain available as explicit Hotelia placeholders. Administration preserves the existing ADMIN session/role gate. Support/backend integration is still stage 12, and administration/backend integration is still stage 13; this refactor does not mark either stage complete.

## Verification

Run `npm test`, `npm run typecheck` and `npm run build`. UI tests import the reorganized production components and use isolated Apollo fixtures; no live records are created. Contract generation must be repeatable without changing generated output.
