# Hotelia frontend / backend contracts

- Hotel owner is the HOTEL_OWNER member role. Public owner profiles and the private owner workspace use the same role; the private workspace is authenticated and scoped by the backend.
- Session state uses memberHotels. Profile and role come from checkAuth/getMember, never JWT profile claims.
- Access/refresh rotation, logout cache clearing and authenticated multipart uploads remain in the shared auth/API layers.
- Contract synchronization generates 78 interfaces and 24 enums from the Hotelia API. GraphQL IDs and timestamps are strings; private password/session fields are excluded.

| Feature | Hotelia backend contract |
| --- | --- |
| Hotel catalog/detail | getHotels/getHotel, hotelCountry/city/address/timezone |
| Rooms and availability | getRooms/getAvailableRooms, nightly roomPrice in USD |
| Hotel owners | HOTEL_OWNER, getHotelOwners, memberHotels, ownerId |
| Saved hotels | favoriteHotel/unfavoriteHotel/getFavorites |
| Recently viewed hotels | Authenticated getVisited |
| Reservations/trips | BookingInput, getMyBookings, createBooking/cancelBooking |
| Stay reviews | Completed-booking hotel reviews through the comment API |
| Owner inventory | createHotel/updateHotel/deleteHotel and room CRUD |
| Owner overview | getOwnerDashboard, completed-stay revenue in USD |
| Owner reservations | getOwnerBookings/getOwnerBooking, confirm/complete/cancel |
| Journal | BoardArticle DTOs, article CRUD and comment API |
| Support | getSupportNotices, getMyInquiries, createSupportInquiry; private member scope and requestId deduplication |
| Notifications | getMyNotifications, getUnreadNotificationCount, markNotificationRead; authenticated receiver scope |
| Administration | Hotel/room/booking/member admin APIs; UI integration pending |

Nullable startingPrice remains nullable. Payments, unsupported price currencies, administration integration is still pending.
