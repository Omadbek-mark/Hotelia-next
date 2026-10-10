import Link from 'next/link';
import { canCancelTrip, canReviewTrip, tripDate } from '../../booking/booking-request';
import type { Booking } from '../../types/contracts';
import { BookingStatus } from '../../enums';
import { Button, Chip, formatUsd, SiteImage } from '../common/ui';

export function TripFacts({ booking }: { booking: Booking }) {
	return (
		<dl className="h-trip-facts">
			<div>
				<dt>Stay schedule</dt>
				<dd>
					{tripDate(booking.checkIn)} — {tripDate(booking.checkOut)}
					<small>{booking.nights} nights</small>
				</dd>
			</div>
			<div>
				<dt>Occupancy</dt>
				<dd>
					{booking.guests} guests<small>{booking.rooms} rooms</small>
				</dd>
			</div>
			<div>
				<dt>Total price</dt>
				<dd className="h-trip-price">
					{formatUsd(booking.totalPrice)}
					<small>{booking.currency}</small>
				</dd>
			</div>
		</dl>
	);
}
export function TripStatus({ booking }: { booking: Booking }) {
	const tone =
		booking.bookingStatus === BookingStatus.CONFIRMED || booking.bookingStatus === BookingStatus.COMPLETED
			? 'success'
			: booking.bookingStatus === BookingStatus.CANCELLED
			? 'danger'
			: 'warning';
	return <Chip tone={tone}>{booking.bookingStatus}</Chip>;
}
export default function TripCard({
	booking,
	memberId,
	reviewed,
	onDetails,
	onCancel,
	onReview,
}: {
	booking: Booking;
	memberId: string;
	reviewed?: boolean;
	onDetails: () => void;
	onCancel: () => void;
	onReview: () => void;
}) {
	return (
		<article className="h-trip-card">
			<SiteImage
				src={booking.hotelData?.hotelImages[0] || booking.roomData?.roomImages[0]}
				alt={booking.hotelData?.hotelName || 'Your hotel stay'}
			/>
			<div className="h-trip-card-body">
				<div className="h-trip-card-top">
					<span className="h-eyebrow">
						{booking.hotelData ? `${booking.hotelData.hotelCity}, ${booking.hotelData.hotelCountry}` : 'Your stay'}
					</span>
					<TripStatus booking={booking} />
				</div>
				<h2>{booking.hotelData?.hotelName || 'Hotel stay'}</h2>
				<p>{booking.roomData?.roomName || 'Reserved accommodation'}</p>
				<TripFacts booking={booking} />
				<div className="h-trip-actions">
					<Button variant="outlined" onClick={onDetails}>
						Trip details
					</Button>
					{canCancelTrip(booking, memberId) && (
						<Button variant="text" onClick={onCancel}>
							Cancel request
						</Button>
					)}
					{canReviewTrip(booking, memberId) &&
						(reviewed ? (
							<Chip tone="success">Reviewed</Chip>
						) : (
							<Button color="secondary" onClick={onReview}>
								Write review
							</Button>
						))}
					<Link href={{ pathname: '/property/detail', query: { id: booking.hotelId } }} className="h-text-link">
						View hotel ↗
					</Link>
				</div>
			</div>
		</article>
	);
}
