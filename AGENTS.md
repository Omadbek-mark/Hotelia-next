# Hotelia frontend — agent yo‘riqnomasi

## Ishlash tartibi

- Foydalanuvchiga o‘zbekcha tushuntiring; u loyihani o‘rganmoqda. Bosqichdan keyin o‘zgarish, sabab va tekshiruv natijalarini tushuntiring, kelishilgan joyda review uchun to‘xtang. Joriy topshiriq umumiy tartibdan ustun.
- Avval mavjud kodni tekshiring. Nestar uslubidagi tuzilma va Hotelia dizaynini saqlang; sababsiz rewrite, yangi framework yoki abstraksiya qo‘shmang.
- Backend kontrakti frontend demo yoki eski rejalardan ustun. Backend qo‘llamagan funksiyani ishlaydigan amal sifatida ko‘rsatmang.
- Commit faqat foydalanuvchi so‘rasa; push, merge va deploy ham foydalanuvchi ko‘rsatmasi bilan. Boshqa o‘zgarishlarni qaytarmang.
- `.env`, token, MongoDB URI yoki private key’ni log, javob yoki Git’ga chiqarmang. Jonli booking, payment, xabar yoki profil yozuvlarini oddiy test uchun yaratmang.

## Stack va tuzilma

- Bu mustaqil frontend repository’si; backend odatda `../Hotelia`da. `nestar-next` arxitektura namunasi, Hotelia API o‘rnini bosmaydi.
- Next.js 15 Pages Router, React 18, TypeScript, Apollo Client 3, MUI 5, SCSS va next-i18next. App Router’ga topshiriqsiz ko‘chirmang.
- Node versiyasi `package.json` engines’da (22.13+ yoki 24). Dependency install uchun Yarn Classic va `yarn.lock`; yangi package-lock yaratmang.
- `pages/`: route entry va Next.js data/translation exportlari. Asosiy UI `libs/components/<feature>/` ichida.
- Feature papkalar: homepage, hotel, booking, member, owner, account, journal, support, admin, about. Layout/common umumiy UI uchun; yangi umumiy mega-component papkasi yaratmang.
- `libs/hooks/`: favorites, locations, viewer/owner refresh va tarjima hooklari.
- `libs/auth`, `api`, `booking`, `search`, `social`, `journal`, `owner`, `admin`: sessiya, upload, validation, cache va domen yordamchilari. Bularni UI ichida takrorlamang.
- `apollo/user`, `apollo/owner`, `apollo/admin`: GraphQL operatsiyalar. `apollo/client.ts`: transport; `apollo/store.ts`: reactive session.
- `libs/types/<domain>` va `libs/enums`: backenddan generatsiya qilinadigan kontraktlar. Export barrel’lari `libs/types/contracts.ts` va `libs/enums/index.ts`.
- `scss/`: feature bo‘yicha responsive uslublar; mavjud import/cascade tartibini saqlang. `public/`: rasmlar, default avatar, EN/RU/UZ locale JSON’lari.

## API, auth va cache

- Backend enum/DTO o‘zgarsa `npm run contracts:sync` ishlating; generated fayllarni qo‘lda tahrirlamang. Generator `../Hotelia/apps/hotelia-api/src/libs`ni o‘qiydi; boshqa path argument bilan berilishi mumkin.
- GraphQL ID va sanalar browser kontraktida string; nullable `startingPrice`ni taxminiy 0 bilan almashtirmang. Operatsiya/schema mosligini tekshiring, unsupported input yubormang.
- Profile/rol serverdagi authenticated member javobidan olinadi; JWT decode faqat token shakli/expiry uchun. Frontend role gate backend authorization o‘rnini bosmaydi.
- `libs/auth/session.ts` hozir access/refresh tokenlarni localStorage’da saqlaydi; HttpOnly cookie allaqachon joriy qilingan deb aytmang. Storage/transportni o‘zgartirish alohida kelishilgan ish.
- Auth link `getValidAccessToken`dan foydalanadi; concurrent requestlar bitta refresh promise’ni bo‘lishadi. Logout/session change credential va viewer cache’ini tozalash oqimini saqlang.
- Rasm yuklash GraphQL multipart (`apollo-upload-client` va `libs/api/upload.ts`) orqali. Axios yoki yangi REST endpointni sababsiz qo‘shmang; preflight header va auth’ni saqlang.
- Session/profile identity almashganda `useViewerRefresh`, owner mutatsiyalarida `useOwnerRefresh`, favoritesda umumiy hook/cache yordamchilarini ishlating.
- Double-submitni bloklang. Idempotent requestId bitta niyat uchun barqaror bo‘lsin; retry uni yangidan yaratmasin. Backend javobisiz booking/status/counter muvaffaqiyatini o‘ylab topmang.
- Filter/pagination URL’larini APIga uzatishdan oldin mavjud parserlar bilan tekshiring. Loading/empty/error/retry holatlarini saqlang; background refresh butun sahifani pirpiratmasin.

## Route va domen qoidalari

- Canonical public routes: `/hotel`, `/hotel/detail?hotelId=…`, `/hotel-owner`, `/hotel-owner/detail?ownerId=…`, `/member?memberId=…`, `/journal`, `/account`, `/support`.
- `/owner` — private HOTEL_OWNER workspace; `/_admin/*` — ADMIN ekranlar. Auth tiklanishi va rol aniqlanmasdan protected query’larni mount qilmang.
- Legacy property/agent/community/mypage URL’lari redirect sifatida qoladi. Yangi UI’da real-estate atamalarini qaytarmang; identifier/query mappingni buzmay saqlang.
- Hotel/room qidiruvi, availability, filters va narxlar backendga mos. Asosiy hudud Uzbekistan, Kazakhstan, Kyrgyzstan; city variantlari mavjud locations query’dan olinadi.
- USD va hotel-local sanalar. Frontend narxi estimate; nights/total/availability yakuniy manbasi backend. Xona so‘rovi jami guests va rooms miqdorini saqlaydi.
- Booking: PENDING/CONFIRMED/CANCELLED/COMPLETED; 15 minut free cancellation, keyin auto-confirm va guest cancellation’da 5% fee. Server qaytargan policy/fee/refundni ko‘rsating; frontend timer server statusini o‘zi almashtirmasin.
- Payment demo: CEO_BANK_ACCOUNT default, BANK_CARD checkout o‘chiq. Profile’da demo card qo‘shish mumkin; haqiqiy pul yechilmaydi. UI eslatmalari saqlansin; to‘liq card/CVV’ni browser storage yoki logga yozmang.
- Hotelga oddiy authenticated comment ratingsiz bo‘lishi mumkin. Verified rated review faqat memberning COMPLETED bookingi uchun; oddiy commentga verified badge qo‘ymang.
- Favorites LikeService API’si; recently viewed authenticated `getVisited`, local soxta history emas. Member statistikasi `memberHotels`; server counterlarini ishlating.
- Owner/public member ma’lumotlari uchun mavjud public GraphQL fragmentlardan foydalaning; private contact/session maydonlarini public query’ga qo‘shmang.
- Notifications account bo‘limida. Admin: Hotels/Rooms, Booking, Personal messages; ownerga tegishli bo‘limlar; oddiy userga umumiy list. Unread yorqin, read xira; bo‘lim unread badge’larini saqlang, ortiqcha filter panel qo‘shmang.
- Private support inquiry ommaviy FAQ/notice emas; admin reply/publication va revision conflict oqimlarini saqlang.

## Chat va dizayn

- `PublicChat.tsx` `_app.tsx`da bitta instance: navigation draft/open state’ni saqlaydi. Guestlarga ochiq native WebSocket, Socket.IO emas. Community room va Gemini assistant alohida tablar.
- Online count/history serverdan; statik demo sonlar yoki tayyor concierge javoblarini real chat o‘rniga qaytarmang. Private user chat deb ta’riflamang.
- Packet contract, reconnect/deduplication va anonymous identity: [chat-integration.md](docs/chat-integration.md).
- Mavjud forest/clay/paper ranglari, typography va responsive dizaynni saqlang. Desktop/mobil overflow, contrast, focus, keyboard va modal dismissalga e’tibor bering.
- `ProfileCard` va boshqa shared UI’ni qayta ishlating. Rasm yo‘q bo‘lsa `getAssetUrl`ning defaultUser.svg fallback’i ishlasin.
- Yangi UI matnlarini mavjud EN/RU/UZ tarjima tizimiga moslang. Language almashganda route/query’ni saqlang.
- Production ekranlarida requestId, resolver nomlari va server hisoblash kabi ichki tafsilotlarni chiqarmang. Payment demo eslatmasi foydalanuvchi qarori uchun kerakli istisno.

## Ishga tushirish va tekshiruv

```bash
yarn install --frozen-lockfile
npm run dev
npm test
npm run typecheck
npm run build
npm run contracts:sync
```

- Dev va oddiy `npm run start` porti 3015. Dev output `.next-dev`, production output `.next`; parallel ishlayotgan dev fayllarini production build bilan almashtirmang.
- UI testlari `scripts/tests/*.test.cjs`da va fixture’lar bilan ishlaydi. Tegishli testni tanlang; har kichik tahrirda barcha suite/buildni takrorlamang. Hujjat tahririda link/diff tekshiruvi yetarli.
- Contract sync backend mavjudligini talab qiladi; har CI run’da ishlatish shart emas. Kontrakt o‘zgarsa generated diff’ni tekshiring.
- Kerakli visual o‘zgarishlarda desktop/mobile ko‘rinishni tekshiring. Qaysi tekshiruv bajarilmaganini ochiq ayting; eski test sonlarini yangi natija deb takrorlamang.

## Docker va deploy

- `develop` ish, `master` production branch; PR orqali o‘tiladi. Bu hujjat push/merge/deployga o‘zi ruxsat bermaydi.
- Docker `output: standalone` bilan `node server.js`ni ishlatadi, ichki port 3001, HOSTNAME=0.0.0.0. `public`, `.next/static`, next-i18next config va locale fayllari runtime’da mavjud bo‘lsin; cache node foydalanuvchisi uchun yoziladigan bo‘lsin.
- `.env*` Docker context’iga kirmaydi. Ochiq API URL’lari build argument: REACT_APP_API_URL, REACT_APP_API_GRAPHQL_URL, REACT_APP_API_WS. URL o‘zgarsa rebuild kerak, restart yetmaydi. Kod NEXT_PUBLIC_* variantlarini ham qo‘llaydi; ularni qarama-qarshi qiymatlar bilan bermang.
- Production manzillari rejalashtirilgan: https://hotelia.uz va https://api.hotelia.uz, chat wss://api.hotelia.uz. JWT/Gemini/MongoDB secretlari browser env yoki image’ga kirmasin.
- CI frontend image’i localhost URL’lari bilan faqat tekshiriladi; Coolify production image’ni haqiqiy URL’lar bilan qayta quradi. CI deploy faqat master push + muvaffaqiyatli checks + sozlangan COOLIFY_URL bo‘lganda ishlaydi.
- Shared VPSda Coolify/Traefik ishlaydi. Boshqa loyihalarga yoki umumiy proxy/firewallga tegmang; og‘ir buildlarni bir vaqtda boshlamang.
- To‘liq Docker/CI sozlash yo‘riqnomalari backend repository’sidagi `docs/docker-local.md` va `docs/ci-cd.md`da.

## Hujjatlar

- Shu fayl avvalgi frontend-architecture va backend-contract-map hujjatlaridagi amaldagi qoidalarni birlashtiradi.
- [Implementation history](docs/hotelia-implementation-plan.md) va [design review](docs/final-review.md) tarixiy bosqichlar/previewlar uchun saqlangan. Eski pending holatlari va test sonlari joriy koddan ustun emas.
