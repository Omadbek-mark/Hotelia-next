import { gql } from '@apollo/client';

export const BOOKING_FIELDS = gql`
	fragment TripBookingFields on Booking {
		_id
		memberId
		hotelId
		roomId
		checkIn
		checkOut
		guests
		rooms
		nights
		pricePerNight
		totalPrice
		currency
		paymentMethod
		paymentStatus
		bookingStatus
		expiresAt
		freeCancellationUntil
		cancellationFeeRate
		cancellationFee
		refundAmount
		cancelledAt
		confirmedAt
		confirmedAutomatically
		createdAt
		updatedAt
	}
`;
export const CREATE_STAY_BOOKING = gql`
	mutation RequestStay($input: BookingInput!) {
		createBooking(input: $input) {
			...TripBookingFields
		}
	}
	${BOOKING_FIELDS}
`;
export const CANCEL_STAY_BOOKING = gql`
	mutation CancelStay($bookingId: String!) {
		cancelBooking(bookingId: $bookingId) {
			...TripBookingFields
		}
	}
	${BOOKING_FIELDS}
`;
export const GET_MY_TRIPS = gql`
	query MyHotelTrips($input: BookingsInquiry!) {
		getMyBookings(input: $input) {
			list {
				...TripBookingFields
				hotelData {
					_id
					hotelName
					hotelCountry
					hotelCity
					hotelAddress
					hotelTimezone
					hotelImages
				}
				roomData {
					_id
					roomName
					roomType
					roomImages
				}
			}
			metaCounter {
				total
			}
		}
	}
	${BOOKING_FIELDS}
`;
export const GET_TRIP_DETAIL = gql`
	query MyTripDetail($bookingId: String!) {
		getBooking(bookingId: $bookingId) {
			...TripBookingFields
			hotelData {
				_id
				hotelName
				hotelCountry
				hotelCity
				hotelAddress
				hotelTimezone
				hotelImages
			}
			roomData {
				_id
				roomName
				roomType
				roomImages
			}
		}
	}
	${BOOKING_FIELDS}
`;
export const CREATE_STAY_REVIEW = gql`
	mutation ReviewCompletedStay($input: CommentInput!) {
		createComment(input: $input) {
			_id
			bookingId
			commentRefId
			commentContent
			rating
		}
	}
`;
