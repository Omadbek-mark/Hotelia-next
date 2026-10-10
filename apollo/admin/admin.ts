import { gql } from '@apollo/client';
export const ADMIN_OVERVIEW = gql`
	query AdminOverview {
		hotels: getAllHotelsByAdmin(input: { page: 1, limit: 1, sort: NEWEST }) {
			metaCounter {
				total
			}
		}
		members: getAllMembersByAdmin(input: { page: 1, limit: 1, search: {} }) {
			metaCounter {
				total
			}
		}
		journal: getAllBoardArticlesByAdmin(input: { page: 1, limit: 1, search: { articleStatus: ACTIVE } }) {
			metaCounter {
				total
			}
		}
		inquiries: getSupportByAdmin(input: { page: 1, limit: 4, noticeCategory: INQUIRY, noticeStatus: HOLD }) {
			metaCounter {
				total
			}
			list {
				_id
				noticeTitle
				createdAt
			}
		}
		bookings: getAllBookingsByAdmin(input: { page: 1, limit: 5 }) {
			metaCounter {
				total
			}
			list {
				_id
				bookingStatus
				checkIn
				checkOut
				totalPrice
				currency
				hotelData {
					_id
					hotelName
				}
				memberData {
					_id
					memberNick
				}
			}
		}
	}
`;
export const ADMIN_HOTELS = gql`
	query AdminHotels($input: AllHotelsInquiry!) {
		getAllHotelsByAdmin(input: $input) {
			list {
				_id
				ownerId
				hotelName
				hotelCountry
				hotelCity
				hotelStatus
				hotelType
				hotelImages
				hotelRating
				hotelReviews
				createdAt
				memberData {
					_id
					memberNick
				}
			}
			metaCounter {
				total
			}
		}
	}
`;
export const ADMIN_HOTEL_UPDATE = gql`
	mutation AdminHotelStatus($input: AdminHotelUpdate!) {
		updateHotelByAdmin(input: $input) {
			_id
			hotelStatus
		}
	}
`;
export const ADMIN_MEMBERS = gql`
	query AdminMembers($input: MembersInquiry!) {
		getAllMembersByAdmin(input: $input) {
			list {
				_id
				memberNick
				memberFullName
				memberImage
				memberType
				memberStatus
				memberHotels
				createdAt
			}
			metaCounter {
				total
			}
		}
	}
`;
export const ADMIN_MEMBER_UPDATE = gql`
	mutation AdminMemberAccess($input: AdminMemberUpdate!) {
		updateMemberByAdmin(input: $input) {
			_id
			memberType
			memberStatus
		}
	}
`;
export const ADMIN_JOURNAL = gql`
	query AdminJournal($input: AllBoardArticlesInquiry!) {
		getAllBoardArticlesByAdmin(input: $input) {
			list {
				_id
				articleTitle
				articleContent
				articleImage
				articleCategory
				articleStatus
				createdAt
				memberData {
					_id
					memberNick
				}
			}
			metaCounter {
				total
			}
		}
	}
`;
export const ADMIN_JOURNAL_UPDATE = gql`
	mutation AdminJournalArchive($input: BoardArticleUpdate!) {
		updateBoardArticleByAdmin(input: $input) {
			_id
			articleStatus
		}
	}
`;
export const ADMIN_ROOMS = gql`
	query AdminRooms($input: AllRoomsInquiry!) {
		getAllRoomsByAdmin(input: $input) {
			list {
				_id
				hotelId
				roomName
				roomType
				roomStatus
				roomPrice
				roomCapacity
				roomQuantity
				roomImages
			}
			metaCounter {
				total
			}
		}
	}
`;
export const ADMIN_ROOM_UPDATE = gql`
	mutation AdminRoomStatus($input: AdminRoomUpdate!) {
		updateRoomByAdmin(input: $input) {
			_id
			roomStatus
		}
	}
`;
export const ADMIN_BOOKINGS = gql`
	query AdminReservations($input: AllBookingsInquiry!) {
		getAllBookingsByAdmin(input: $input) {
			list {
				_id
				bookingStatus
				checkIn
				checkOut
				nights
				guests
				rooms
				totalPrice
				currency
				createdAt
				hotelData {
					_id
					hotelName
					hotelTimezone
				}
				roomData {
					_id
					roomName
				}
				memberData {
					_id
					memberNick
				}
			}
			metaCounter {
				total
			}
		}
	}
`;
export const ADMIN_CANCEL_BOOKING = gql`
	mutation AdminCancelReservation($bookingId: String!) {
		cancelBookingByAdmin(bookingId: $bookingId) {
			_id
			bookingStatus
		}
	}
`;
const supportFields = gql`
	fragment AdminSupportFields on AdminSupportNotice {
		_id
		memberId
		noticeRevision
		noticeCategory
		noticeStatus
		noticeTitle
		noticeContent
		noticeResponse
		respondedAt
		createdAt
		updatedAt
	}
`;
export const ADMIN_SUPPORT = gql`
	query AdminSupport($input: AdminSupportInquiry!) {
		getSupportByAdmin(input: $input) {
			list {
				...AdminSupportFields
			}
			metaCounter {
				total
			}
		}
	}
	${supportFields}
`;
export const ADMIN_SUPPORT_CREATE = gql`
	mutation AdminSupportCreate($input: AdminSupportCreate!) {
		createSupportByAdmin(input: $input) {
			...AdminSupportFields
		}
	}
	${supportFields}
`;
export const ADMIN_SUPPORT_UPDATE = gql`
	mutation AdminSupportUpdate($input: AdminSupportUpdate!) {
		updateSupportByAdmin(input: $input) {
			...AdminSupportFields
		}
	}
	${supportFields}
`;
export const ADMIN_SUPPORT_REPLY = gql`
	mutation AdminSupportReply($input: AdminSupportReply!) {
		replySupportByAdmin(input: $input) {
			...AdminSupportFields
		}
	}
	${supportFields}
`;
