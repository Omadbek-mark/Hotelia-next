import { useApolloClient, useQuery, useReactiveVar } from '@apollo/client';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Skeleton } from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo, useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { CANCEL_STAY_BOOKING, GET_MY_TRIPS, GET_TRIP_DETAIL } from '../../../apollo/user/bookings';
import { bookingError, canCancelTrip, parseTripsQuery } from '../../booking/booking-request';
import type { Booking, Bookings } from '../../types/contracts';
import { BookingStatus } from '../../enums';
import StayReviewDialog from '../booking/StayReviewDialog';
import TripCard, { TripFacts, TripStatus } from '../booking/TripCard';
import { Button, EmptyState, Field, Pagination } from '../common/ui';

function TripDialog({
	bookingId,
	cancel,
	onClose,
	onCancelled,
}: {
	bookingId: string;
	cancel: boolean;
	onClose: () => void;
	onCancelled: () => void;
}) {
	const user = useReactiveVar(userVar),
		client = useApolloClient();
	const { data, loading, error, refetch } = useQuery<{ getBooking: Booking }>(GET_TRIP_DETAIL, {
		variables: { bookingId },
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const [pending, setPending] = useState(false),
		[message, setMessage] = useState(''),
		[done, setDone] = useState(false);
	const booking = data?.getBooking;
	const guard = useRef(false);
	const submit = async () => {
		if (guard.current || !booking || !canCancelTrip(booking, user._id)) return;
		guard.current = true;
		setPending(true);
		setMessage('');
		try {
			const result = await client.mutate<{ cancelBooking: Booking }>({
				mutation: CANCEL_STAY_BOOKING,
				variables: { bookingId },
			});
			if (!result.data?.cancelBooking) throw Error('No cancellation response');
			setDone(true);
			onCancelled();
		} catch (failure) {
			setMessage(bookingError(failure));
			void refetch().catch(() => {});
		} finally {
			guard.current = false;
			setPending(false);
		}
	};
	return (
		<Dialog
			open
			onClose={() => {
				if (!pending) onClose();
			}}
			maxWidth="sm"
			fullWidth
			aria-labelledby="trip-dialog-title"
		>
			<DialogTitle id="trip-dialog-title">
				{cancel ? 'Cancel your request?' : 'Your trip'}
				<IconButton aria-label="Close trip" disabled={pending} onClick={onClose} sx={{ float: 'right' }}>
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent>
				<div className="h-trip-dialog">
					{loading ? (
						<Skeleton height={180} />
					) : error || !booking ? (
						<EmptyState
							error
							title="Trip could not load"
							action={<Button onClick={() => refetch().catch(() => {})}>Try again</Button>}
						/>
					) : (
						<>
							<TripStatus booking={booking} />
							<h3>{booking.hotelData?.hotelName || 'Hotel stay'}</h3>
							<p>{booking.roomData?.roomName || 'Reserved accommodation'}</p>
							<TripFacts booking={booking} />
							{booking.hotelData && <p>{booking.hotelData.hotelAddress}</p>}
							{booking.bookingStatus === BookingStatus.PENDING && booking.expiresAt && (
								<p className="h-booking-note">Hold until {new Date(booking.expiresAt).toLocaleString()}</p>
							)}
							{done ? (
								<Alert severity="success">Your request was cancelled.</Alert>
							) : cancel && canCancelTrip(booking, user._id) ? (
								<>
									<p>Cancel this stay request? Your host will see the updated status.</p>
									<Button color="secondary" disabled={pending} onClick={submit}>
										{pending ? 'Cancelling…' : 'Confirm cancellation'}
									</Button>
								</>
							) : cancel ? (
								<Alert severity="info">This trip can no longer be cancelled.</Alert>
							) : null}
						</>
					)}
					{message && <Alert severity="error">{message}</Alert>}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default function MyTrips() {
	const router = useRouter(),
		user = useReactiveVar(userVar);
	const parsed = useMemo(() => parseTripsQuery(router.query), [router.query]);
	const { data, loading, error, refetch } = useQuery<{ getMyBookings: Bookings }>(GET_MY_TRIPS, {
		variables: { input: parsed.input },
		skip: !router.isReady || !user._id || !!parsed.error,
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
	});
	const [active, setActive] = useState<{ id: string; cancel: boolean }>(),
		[review, setReview] = useState<Booking>(),
		[reviewed, setReviewed] = useState<string[]>([]),
		[message, setMessage] = useState('');
	const list = data?.getMyBookings.list.filter((booking) => booking.memberId === user._id) || [],
		total = data?.getMyBookings.metaCounter[0]?.total || 0;
	const navigate = (values: Record<string, string>) =>
		router
			.push({ pathname: '/mypage', query: { ...router.query, category: 'myBookings', ...values } }, undefined, {
				scroll: false,
			})
			.catch(() => setMessage('Could not update your trips. Try again.'));
	const refresh = () => {
		refetch().catch(() => setMessage('Your change was saved. Refresh trips to see the latest list.'));
	};
	return (
		<>
			<Head>
				<title>My Trips · Hotelia</title>
			</Head>
			<div className="h-trips-heading">
				<div>
					<span className="h-eyebrow">Your travel journal</span>
					<h1>My trips.</h1>
				</div>
				<Button href="/property" variant="outlined">
					Find a stay ↗
				</Button>
			</div>
			<div className="h-trips-toolbar">
				<p aria-live="polite">{loading ? 'Opening your trips…' : `${total} ${total === 1 ? 'trip' : 'trips'}`}</p>
				<Field
					select
					label="Trip status"
					value={parsed.input.bookingStatus || ''}
					onChange={(event) => navigate({ bookingStatus: event.target.value, tripPage: '1' })}
				>
					<MenuItem value="">All trips</MenuItem>
					{Object.values(BookingStatus).map((status) => (
						<MenuItem key={status} value={status}>
							{status.charAt(0) + status.slice(1).toLowerCase()}
						</MenuItem>
					))}
				</Field>
				<Button variant="text" disabled={loading} onClick={refresh}>
					Refresh
				</Button>
			</div>
			{message && (
				<Alert severity="warning" onClose={() => setMessage('')}>
					{message}
				</Alert>
			)}
			{parsed.error ? (
				<EmptyState
					error
					title="Check your trip filters"
					description={parsed.error}
					action={<Button onClick={() => navigate({ bookingStatus: '', tripPage: '1' })}>Start fresh</Button>}
				/>
			) : loading || !router.isReady ? (
				<div aria-label="Loading trips" aria-busy="true">
					<Skeleton variant="rectangular" height={230} />
					<Skeleton height={240} />
				</div>
			) : error ? (
				<EmptyState error title="Trips could not load" action={<Button onClick={refresh}>Try again</Button>} />
			) : !list.length ? (
				<EmptyState
					title={parsed.input.bookingStatus ? 'No trips with this status' : 'Your next chapter awaits'}
					description="Find a stay you’ll remember."
					action={
						<Button href="/property" color="secondary">
							Explore stays
						</Button>
					}
				/>
			) : (
				<div className="h-trip-list">
					{list.map((booking) => (
						<TripCard
							key={booking._id}
							booking={booking}
							memberId={user._id}
							reviewed={reviewed.includes(booking._id)}
							onDetails={() => setActive({ id: booking._id, cancel: false })}
							onCancel={() => setActive({ id: booking._id, cancel: true })}
							onReview={() => setReview(booking)}
						/>
					))}
				</div>
			)}
			{!loading && !error && !parsed.error && (
				<Pagination
					page={parsed.input.page}
					limit={parsed.input.limit}
					total={total}
					onChange={(page) => navigate({ tripPage: String(page) })}
				/>
			)}
			{!loading && !error && !parsed.error && parsed.input.page > 1 && !list.length && (
				<Button onClick={() => navigate({ tripPage: '1' })}>First trip page</Button>
			)}
			{active && (
				<TripDialog
					key={active.id}
					bookingId={active.id}
					cancel={active.cancel}
					onClose={() => setActive(undefined)}
					onCancelled={refresh}
				/>
			)}
			{review && (
				<StayReviewDialog
					key={review._id}
					booking={review}
					onClose={() => setReview(undefined)}
					onReviewed={(id) => setReviewed((previous) => (previous.includes(id) ? previous : [...previous, id]))}
				/>
			)}
		</>
	);
}
