import { gql } from '@apollo/client';
import { BOOKING_FIELDS } from '../user/bookings';
const hotelFields = gql`
	fragment OwnerHotelFields on Hotel {
		_id
		ownerId
		hotelName
		hotelDescription
		hotelCountry
		hotelCity
		hotelAddress
		hotelTimezone
		hotelType
		hotelStatus
		hotelImages
		hotelAmenities
		hotelRating
		hotelReviews
		hotelViews
		hotelLikes
	}
`;
const roomFields = gql`
	fragment OwnerRoomFields on Room {
		_id
		hotelId
		roomName
		roomDescription
		roomType
		roomStatus
		roomPrice
		roomCapacity
		roomQuantity
		bedType
		roomSize
		roomImages
		roomAmenities
	}
`;
export const OWNER_DASHBOARD = gql`
	query HostDashboard {
		getOwnerDashboard {
			totalHotels
			totalRooms
			totalBookings
			totalRevenue
			currency
		}
	}
`;
export const OWNER_HOTELS = gql`
	query HostHotels($input: OwnerHotelsInquiry!) {
		getOwnerHotels(input: $input) {
			list {
				...OwnerHotelFields
			}
			metaCounter {
				total
			}
		}
	}
	${hotelFields}
`;
export const OWNER_HOTEL = gql`
	query HostHotel($hotelId: String!) {
		getOwnerHotel(hotelId: $hotelId) {
			...OwnerHotelFields
		}
	}
	${hotelFields}
`;
export const CREATE_HOTEL = gql`
	mutation HostCreateHotel($input: HotelInput!) {
		createHotel(input: $input) {
			_id
		}
	}
`;
export const UPDATE_HOTEL = gql`
	mutation HostUpdateHotel($input: HotelUpdate!) {
		updateHotel(input: $input) {
			_id
			hotelStatus
		}
	}
`;
export const DELETE_HOTEL = gql`
	mutation HostDeleteHotel($hotelId: String!) {
		deleteHotel(hotelId: $hotelId) {
			_id
			hotelStatus
		}
	}
`;
export const OWNER_ROOMS = gql`
	query HostRooms($input: OwnerRoomsInquiry!) {
		getOwnerRooms(input: $input) {
			list {
				...OwnerRoomFields
			}
			metaCounter {
				total
			}
		}
	}
	${roomFields}
`;
export const OWNER_ROOM = gql`
	query HostRoom($roomId: String!) {
		getOwnerRoom(roomId: $roomId) {
			...OwnerRoomFields
		}
	}
	${roomFields}
`;
export const CREATE_ROOM = gql`
	mutation HostCreateRoom($input: RoomInput!) {
		createRoom(input: $input) {
			_id
			hotelId
		}
	}
`;
export const UPDATE_ROOM = gql`
	mutation HostUpdateRoom($input: RoomUpdate!) {
		updateRoom(input: $input) {
			_id
			roomStatus
		}
	}
`;
export const DELETE_ROOM = gql`
	mutation HostDeleteRoom($roomId: String!) {
		deleteRoom(roomId: $roomId) {
			_id
			roomStatus
		}
	}
`;
const reservationFields = gql`
	fragment HostReservationFields on Booking {
		...TripBookingFields
		hotelData {
			_id
			hotelName
			hotelCity
			hotelTimezone
			hotelImages
		}
		roomData {
			_id
			roomName
			roomImages
		}
		memberData {
			_id
			memberNick
			memberImage
		}
	}
	${BOOKING_FIELDS}
`;
export const OWNER_BOOKINGS = gql`
	query HostReservations($input: OwnerBookingsInquiry!) {
		getOwnerBookings(input: $input) {
			list {
				...HostReservationFields
			}
			metaCounter {
				total
			}
		}
	}
	${reservationFields}
`;
export const OWNER_BOOKING = gql`
	query HostReservation($bookingId: String!) {
		getOwnerBooking(bookingId: $bookingId) {
			...HostReservationFields
		}
	}
	${reservationFields}
`;
export const CONFIRM_BOOKING = gql`
	mutation HostConfirmReservation($bookingId: String!) {
		confirmBooking(bookingId: $bookingId) {
			...TripBookingFields
		}
	}
	${BOOKING_FIELDS}
`;
export const COMPLETE_BOOKING = gql`
	mutation HostCompleteReservation($bookingId: String!) {
		completeBooking(bookingId: $bookingId) {
			...TripBookingFields
		}
	}
	${BOOKING_FIELDS}
`;
