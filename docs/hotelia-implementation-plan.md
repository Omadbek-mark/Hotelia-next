# Hotelia — Open Horizons implementation plan

## Maqsad

Stitch’da tayyorlangan 30 previewni Hotelia backendiga ulangan, responsive frontendga aylantirish. Katta suratlar, qisqa matnlar, ivory / forest / terracotta ranglari va yagona komponentlar tizimi saqlanadi.

Boshlang‘ich holat: `develop`, `3e0bc16`, Next.js Pages Router, React, TypeScript, MUI, SCSS va Apollo. Mavjud stack asosida ishlanadi. Backenddagi Hotelia kontraktlari manba hisoblanadi; previewdagi namunaviy ma’lumotlar ishlab chiqarish ma’lumoti emas.

## Ishlash tartibi

Holat: 1-bosqichning texnik asosi va 2-bosqichning dizayn tizimi/layoutlari bajarildi; keyingi bosqich — account ekranlari. Batafsil kontrakt xaritasi: `docs/backend-contract-map.md`.

2-bosqich tekshiruvlari: TypeScript va production build o‘tdi; brauzerda yangi public header/footer, 390px mobil menu drawer va anonymous admin access holati tekshirildi. Eski sahifa kontenti keyingi feature bosqichlarida almashtiriladi. Owner shell shu bosqichda komponent sifatida tayyorlandi, inventory sahifalariga 11-bosqichda ulanadi.

- Har bosqichda UI va unga tegishli API birga tugallanadi.
- Desktop va mobil ko‘rinishlar bir bosqichda amalga oshiriladi.
- Loading, empty, error va permission holatlari har sahifa bilan birga quriladi.
- Har tekshirilgan mantiqiy qism alohida commit bo‘ladi. Katta bosqich zaruratga ko‘ra bir necha commitga bo‘linadi.
- Push alohida ko‘rsatmaga binoan qilinadi.
- Galereyaning chap menyusi productionga ko‘chirilmaydi. Public navbar, account navigatsiyasi, owner sidebar va admin sidebar alohida vazifaga ega.

## Ketma-ket bosqichlar

| Bosqich | Ishlar va natija | Dizayn sahifalari | Commit mavzusi |
|---|---|---|---|
| 1. Texnik asos va kontrakt | Hozirgi build holatini tekshirish; eski property/member modellari bilan backend hotel/room/booking DTOlari farqini xaritalash; config, Apollo transport, auth token va asset URLlarini moslash. Backendda mavjud bo‘lmagan imkoniyatlarni ajratish. | Barcha sahifalar uchun asos | `chore: establish Hotelia frontend foundation` |
| 2. Dizayn tizimi va layout | Ranglar, shriftlar, spacing, breakpointlar; button, input, select, chip, card, modal, pagination, skeleton va feedback komponentlari. Public navbar/footer, account, owner va admin layoutlari. | 01–30 umumiy tizim | `feat: add Open Horizons design system and layouts` |
| 3. Account va ruxsatlar | Nickname + password login; nickname + email + password signup; logout, session tiklash, USER/HOTEL_OWNER/ADMIN route himoyasi; profile form va avatar upload. | 05, 09 | `feat: connect authentication and account profile` |
| 4. Home | Suratli hero, destination/date/guests/rooms qidiruvi; real hotel kolleksiyalari va host kartalari; qisqa matnlar, mobile navbar va search. Kolleksiyalar faqat API qo‘llaydigan sorting/filterlardan olinadi. | 01 | `feat: build Hotelia home and discovery search` |
| 5. Hotel qidiruvi | Filter/sort/pagination; URLda qidiruv holatini saqlash; destination, dates, guests, rooms, price, rating, type va amenities; mobile filter drawer; hotel card va favorite action. | 02 | `feat: connect hotel catalog and search filters` |
| 6. Hotel tafsiloti va xonalar | Foto gallery, hotel/host ma’lumotlari, amenities, mavjud xonalar, xona tanlash, narx va reviewlarni o‘qish. Sanalar yoki occupancy o‘zgarsa availability yangilanadi. | 03 | `feat: connect hotel details and room availability` |
| 7. Bron va My Trips | Booking request dialog, validation, UUID requestId, takroriy yuborishni oldini olish; backenddan qaytgan total va status; My Trips, ruxsat etilgan cancel amali; COMPLETED booking uchun bir martalik review. | 04, 06 | `feat: add booking requests trips and verified reviews` |
| 8. Shaxsiy kolleksiyalar | Saved, recently viewed, account menu; favorite/unfavorite cache yangilanishi; real backend view/like ma’lumotlari. | 07, 08 | `feat: connect saved and recently viewed stays` |
| 9. Host va social | Host directory/detail, member profile, followers/following; haqiqiy host hotellari va follow amallari. Previewdagi xabar yoki inquiry tugmalari mavjud backend kontrakti bilan tekshiriladi. | 10–13 | `feat: connect hosts profiles and follows` |
| 10. Community | Journal listing/detail, pagination, article editor, My Articles, ruxsat etilgan edit/delete va comment amallari; mavjud upload oqimi. | 14–16, 19 | `feat: build Hotelia journal and article management` |
| 11. Owner paneli | Owner hotels, create/edit hotel va upload; rooms ro‘yxati va create/edit; ACTIVE/PAUSED holatlari; backenddagi bron boshqaruvi va dashboard ko‘rsatkichlari. Owner bookings uchun mavjud uslubda qo‘shimcha ekran kerak bo‘lsa shu bosqichda ishlab chiqiladi. | 21–24 + owner bookings | `feat: connect owner inventory and reservations` |
| 12. Support va system | Help/FAQ, Notices, About; notifications va read holatlari; backend qo‘llaydigan inquiry oqimi; 404, access denied va global error holatlari. | 17, 18, 20, 30 | `feat: connect support notifications and system states` |
| 13. Admin paneli | Overview, hotels, users, community va FAQ/Notice/Inquiry boshqaruvi; admin ruxsatlari; mavjud backend mutationlarga mos amallar va tasdiqlash dialoglari. | 25–29 | `feat: connect Hotelia administration` |
| 14. Yakuniy tekshiruv | Barcha 30 previewga mos ekranlar, navigatsiya, responsive layout, accessibility, image loading va performance; real API bilan asosiy user/owner/admin oqimlari; build va tegishli tekshiruvlar. | Barchasi | `fix: polish responsive layouts and integration flows` |

## Backendga mos qat’iy qoidalar

- Hotel/room enumlari va amenities backend bilan bir xil bo‘ladi.
- Narxlar USD; booking total va nights backend hisoblaydi. Frontenddagi estimate yakuniy tasdiqlangan narx sifatida ko‘rsatilmaydi.
- Booking: PENDING, CONFIRMED, CANCELLED, COMPLETED. Har amal backend ruxsatiga mos.
- Review: faqat o‘zining COMPLETED bookingi, bir bookingga bir review, rating 1–5 butun son.
- Owner dashboard revenue backenddagi COMPLETED bookinglar ta’rifiga mos ko‘rsatiladi.
- To‘lov integratsiyasi, coupon, refund, social login yoki host messaging faqat backend qo‘llasa qo‘shiladi.
- Production ekranlarida requestId, resolver nomlari va server hisoblash kabi implementatsiya tafsilotlari chiqarilmaydi.

## Har bosqichning tugallanish mezoni

1. Tegishli ekran desktop va mobil ko‘rinishda tayyor.
2. API amallari, session va ruxsatlar tekshirilgan.
3. Loading, empty va error holatlari mavjud.
4. O‘zgargan qism uchun TypeScript/build va zarur funksional tekshiruvlar o‘tgan; oldindan mavjud muammolar alohida qayd etilgan.
5. Natija ko‘rib chiqiladigan diff bilan commit qilingan.

Birinchi asosiy foydalanuvchi oqimi 7-bosqich yakunida tayyor bo‘ladi: Home → Search → Hotel → Booking → My Trips.
