import { gql } from '@apollo/client';

export const GET_HOTEL_DETAIL = gql`
	query HotelDetail($hotelId: String!) {
		getHotel(hotelId: $hotelId) {
			_id
			ownerId
			hotelName
			hotelDescription
			hotelCountry
			hotelCity
			hotelAddress
			hotelTimezone
			hotelType
			hotelImages
			hotelAmenities
			hotelRating
			hotelReviews
			hotelLikes
			hotelViews
			isFavorite
			memberData {
				_id
				memberNick
				memberImage
				memberDesc
			}
		}
	}
`;
const roomFields = gql`
	fragment DetailRoomFields on Room {
		_id
		hotelId
		roomName
		roomDescription
		roomType
		roomPrice
		roomCapacity
		roomQuantity
		bedType
		roomSize
		roomImages
		roomAmenities
		roomStatus
	}
`;
export const GET_HOTEL_ROOMS = gql`
	query HotelRoomCollection($input: RoomsInquiry!) {
		getRooms(input: $input) {
			list {
				...DetailRoomFields
			}
			metaCounter {
				total
			}
		}
	}
	${roomFields}
`;
// AvailableRoom is a separate GraphQL object, so select its fields explicitly.
export const GET_AVAILABLE_HOTEL_ROOMS = gql`
	query HotelRoomAvailability($input: AvailableRoomsInquiry!) {
		getAvailableRooms(input: $input) {
			list {
				_id
				hotelId
				roomName
				roomDescription
				roomType
				roomPrice
				roomCapacity
				roomQuantity
				bedType
				roomSize
				roomImages
				roomAmenities
				roomStatus
				availableQuantity
			}
			metaCounter {
				total
			}
		}
	}
`;
export const GET_HOTEL_REVIEWS = gql`
	query HotelGuestReviews($input: CommentsInquiry!) {
		getComments(input: $input) {
			list {
				_id
				rating
				bookingId
				commentContent
				createdAt
				memberData {
					_id
					memberNick
					memberImage
				}
			}
			metaCounter {
				total
			}
		}
	}
`;
export const SAVE_DETAIL_HOTEL = gql`
	mutation SaveDetailHotel($hotelId: String!) {
		favoriteHotel(hotelId: $hotelId) {
			hotelId
			isFavorite
			hotelLikes
		}
	}
`;
export const UNSAVE_DETAIL_HOTEL = gql`
	mutation UnsaveDetailHotel($hotelId: String!) {
		unfavoriteHotel(hotelId: $hotelId) {
			hotelId
			isFavorite
			hotelLikes
		}
	}
`;

export const CREATE_HOTEL_COMMENT = gql`
	mutation CreateHotelComment($input: CommentInput!) {
		createComment(input: $input) { _id commentContent createdAt }
	}
`;
