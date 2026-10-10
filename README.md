# Hotelia Next

Hotel marketplace built with Next.js Pages Router, React, MUI and Apollo Client. The API lives in the sibling `Hotelia` repository.

## Run locally

```sh
yarn install --frozen-lockfile
npm run dev
```

Open http://localhost:3015. `npm run start` also uses port 3015 after `npm run build`.
Configure `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_GRAPHQL_URL` for the Hotelia API (local default: port 3021).

## Architecture

The folder boundaries follow `nestar-next`: route entry points in `pages`, feature components in `libs/components`, shared hooks, domain types/enums, Apollo operations and SCSS. Hotelia keeps its own design and backend contracts.

- `pages/`: routes and Next.js data-loading exports; page implementations live in their feature folders.
- `libs/components/homepage`, `hotel`, `member`, `journal`, `account`, `owner`: feature screens and components.
- `libs/components/layout`, `common`: shared layouts and UI primitives.
- `libs/hooks`: viewer refresh and owner cache refresh hooks.
- `libs/auth`, `api`, `booking`, `search`, `social`, `journal`, `owner`: session, uploads, validation and domain helpers.
- `libs/types/<domain>` and `libs/enums`: generated Hotelia API contracts. `libs/types/contracts.ts` and `libs/enums/index.ts` are export barrels.
- `apollo/user`, `apollo/owner`: GraphQL operations; `client.ts` configures authenticated transport and `store.ts` holds session state.
- `scss/`: responsive styles split by feature, imported in order by `main.scss` through `app.scss`.
- `libs/config/design-assets.json`: design photography references.
- `public/`: assets used by Hotelia and locale namespaces.

Canonical routes are `/hotel`, `/hotel-owner`, `/journal` and `/account`. Legacy bookmarks redirect to these routes. They represent Hotelia stays, hosts and journal pages. The inherited real-estate components and API operations have been removed.

Support includes quick answers, published FAQs/notices, private inquiries and notifications. Administration still awaits stage 13 and retains its ADMIN role gate.

## Validate

```sh
npm test
npm run typecheck
npm run build
npm run contracts:sync
```

Contract synchronization reads GraphQL-decorated DTOs and enums from `../Hotelia`. Do not edit generated files manually. The UI tests use fixtures and do not create live backend records.

See [the implementation plan](docs/hotelia-implementation-plan.md) and [architecture notes](docs/frontend-architecture.md).
