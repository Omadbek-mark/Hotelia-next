import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useApolloClient, useReactiveVar } from '@apollo/client';
import { Alert, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { userVar } from '../../../apollo/store';
import { CREATE_STAY_BOOKING } from '../../../apollo/hotelia/bookings';
import type { AvailableRoom, Booking, Hotel, StayInput } from '../../types/hotelia/contracts';
import { bookingError, bookingRequester, tripDate } from '../../booking/booking-request';
import { canSelectRoom, estimateStay, parseRoomSelection } from '../../booking/room-selection';
import { Button, Chip, formatUsd } from './ui';

export default function BookingRequestDialog({
	hotel,
	room,
	stay,
	open,
	onClose,
	onBooked,
}: {
	hotel: Hotel;
	room: AvailableRoom;
	stay: StayInput;
	open: boolean;
	onClose: () => void;
	onBooked: () => void;
}) {
	const router = useRouter(),
		client = useApolloClient(),
		user = useReactiveVar(userVar);
	const [pending, setPending] = useState(false),
		[error, setError] = useState(''),
		[receipt, setReceipt] = useState<Booking>();
	const guard = useRef(false);
	const member = useRef(user._id);
	member.current = user._id;
	const parsed = parseRoomSelection(
		{
			id: hotel._id,
			checkIn: stay.checkIn,
			checkOut: stay.checkOut,
			guests: String(stay.guests),
			rooms: String(stay.rooms || 1),
		},
		hotel.hotelTimezone,
	);
	const estimate = estimateStay(room.roomPrice, parsed.nights, stay.rooms || 1);
	const request = async () => {
		if (guard.current || receipt) return;
		if (!user._id) {
			const referrer = new URL(router.asPath, 'http://hotelia.local');
			referrer.searchParams.set('selectedRoom', room._id);
			await router.push({
				pathname: '/account/join',
				query: { referrer: referrer.pathname + referrer.search },
			});
			return;
		}
		if (parsed.error || !canSelectRoom(room, stay)) {
			setError(parsed.error || 'Refresh availability and choose an available room.');
			return;
		}
		guard.current = true;
		setPending(true);
		setError('');
		const memberId = user._id;
		try {
			const booking = await bookingRequester().request(memberId, { ...stay, roomId: room._id }, async (input) => {
				const result = await client.mutate<{ createBooking: Booking }>({
					mutation: CREATE_STAY_BOOKING,
					variables: { input },
				});
				if (!result.data?.createBooking) throw Error('No booking response');
				return result.data.createBooking;
			});
			if (member.current !== memberId) return;
			setReceipt(booking);
			client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'getMyBookings' });
		} catch (failure) {
			if (member.current === memberId) setError(bookingError(failure));
		} finally {
			guard.current = false;
			setPending(false);
		}
	};
	const close = () => {
		if (pending) return;
		if (receipt) onBooked();
		onClose();
	};
	return (
		<Dialog
			open={open}
			onClose={close}
			maxWidth="sm"
			fullWidth
			aria-labelledby="booking-request-title"
			className="h-booking-dialog"
		>
			<DialogTitle id="booking-request-title">
				{receipt ? 'Your stay request' : 'Request your stay'}
				<IconButton aria-label="Close booking" disabled={pending} onClick={close} sx={{ float: 'right' }}>
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent>
				{receipt && (
					<div className="h-booking-success">
						<CheckCircleOutlineIcon />
						<h3>Request received.</h3>
						<Chip tone={receipt.bookingStatus === 'CONFIRMED' ? 'success' : 'neutral'}>{receipt.bookingStatus}</Chip>
					</div>
				)}
				<div className="h-booking-place">
					<span className="h-eyebrow">
						{hotel.hotelCity}, {hotel.hotelCountry}
					</span>
					<h3>{hotel.hotelName}</h3>
					<p>{room.roomName}</p>
				</div>
				<dl className="h-booking-facts">
					<div>
						<dt>Dates</dt>
						<dd>
							{tripDate(receipt?.checkIn || stay.checkIn)} — {tripDate(receipt?.checkOut || stay.checkOut)}
						</dd>
					</div>
					<div>
						<dt>Duration</dt>
						<dd>{receipt?.nights || parsed.nights} nights</dd>
					</div>
					<div>
						<dt>Occupancy</dt>
						<dd>
							{receipt?.guests || stay.guests} guests · {receipt?.rooms || stay.rooms || 1} rooms
						</dd>
					</div>
					<div>
						<dt>Room rate</dt>
						<dd>{formatUsd(receipt?.pricePerNight ?? room.roomPrice)} / night / room</dd>
					</div>
				</dl>
				<div className="h-booking-total">
					<span>
						{receipt ? 'Total' : 'Estimated total'}
						<small>{receipt?.currency || 'USD'}</small>
					</span>
					<strong>
						{receipt ? formatUsd(receipt.totalPrice) : estimate !== undefined ? formatUsd(estimate) : '—'}
					</strong>
				</div>
				<p className="h-booking-note">
					{receipt
						? receipt.bookingStatus === 'PENDING'
							? 'Awaiting your host’s confirmation. Follow your request in My Trips.'
							: 'Your latest status is available in My Trips.'
						: 'Your host confirms the stay. The final total is returned when you send your request.'}
				</p>
				{error && <Alert severity="error">{error}</Alert>}
				<div className="h-dialog-actions">
					{receipt ? (
						<>
							<Button fullWidth onClick={() => router.push('/mypage?category=myBookings')}>
								View My Trips
							</Button>
							<Button fullWidth variant="text" onClick={close}>
								Done
							</Button>
						</>
					) : (
						<>
							<Button fullWidth color="secondary" disabled={pending || !!parsed.error} onClick={request}>
								{pending ? 'Sending request…' : user._id ? 'Send booking request' : 'Sign in to request'}
							</Button>
							<Button variant="text" fullWidth disabled={pending} onClick={close}>
								Keep exploring
							</Button>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
