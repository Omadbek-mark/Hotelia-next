import { useApolloClient, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import {
	COMPLETE_BOOKING,
	CONFIRM_BOOKING,
	OWNER_BOOKING,
	OWNER_BOOKINGS,
	OWNER_HOTEL,
} from '../../../apollo/owner/owner';
import { userVar } from '../../../apollo/store';
import { CANCEL_STAY_BOOKING } from '../../../apollo/user/bookings';
import { useOwnerRefresh } from '../../hooks/useOwnerRefresh';
import { label, ownerError, ownerFilters, reservationActions } from '../../owner/model';
import { socialHref } from '../../social/query';
import { Booking, Bookings, Hotel } from '../../types/contracts';
import { BookingStatus, MemberType } from '../../enums';
import { Button, Chip, EmptyState, Field, formatUsd, Modal, Pagination, SiteImage } from '../common/ui';
export default function OwnerReservations({ compact = false }: { compact?: boolean }) {
	const router = useRouter(),
		user = useReactiveVar(userVar),
		client = useApolloClient(),
		refresh = useOwnerRefresh(),
		filters = ownerFilters(compact ? {} : router.query, 'bookings'),
		[now, setNow] = useState(new Date()),
		[checkIn, setCheckIn] = useState(filters.checkIn || ''),
		[checkOut, setCheckOut] = useState(filters.checkOut || ''),
		[target, setTarget] = useState<{ booking: Booking; action: 'confirm' | 'complete' | 'cancel' }>(),
		[error, setError] = useState(''),
		[busy, setBusy] = useState(false),
		lock = useRef(false);
	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 30000);
		return () => clearInterval(timer);
	}, []);
	useEffect(() => {
		setCheckIn(filters.checkIn || '');
		setCheckOut(filters.checkOut || '');
	}, [filters.checkIn, filters.checkOut]);
	const change = (patch: Record<string, string | undefined>) =>
		router.push(socialHref('/owner', { ...router.query, tab: 'bookings', ...patch }), undefined, { scroll: false });
	const result = useQuery<{ getOwnerBookings: Bookings }>(OWNER_BOOKINGS, {
		variables: {
			input: {
				page: filters.page,
				limit: compact ? 3 : 6,
				...(compact
					? { bookingStatus: BookingStatus.PENDING }
					: filters.status
					? { bookingStatus: filters.status as BookingStatus }
					: {}),
				...(filters.hotelId ? { hotelId: filters.hotelId } : {}),
				...(filters.checkIn ? { checkIn: filters.checkIn, checkOut: filters.checkOut } : {}),
			},
		},
		skip: !router.isReady || !!filters.error || user.memberType !== MemberType.HOTEL_OWNER,
		fetchPolicy: 'network-only',
	});
	const hotel = useQuery<{ getOwnerHotel: Hotel }>(OWNER_HOTEL, {
		variables: { hotelId: filters.hotelId },
		skip:
			compact || !router.isReady || !filters.hotelId || !!filters.error || user.memberType !== MemberType.HOTEL_OWNER,
		fetchPolicy: 'network-only',
	});
	const [confirm] = useMutation(CONFIRM_BOOKING),
		[complete] = useMutation(COMPLETE_BOOKING),
		[cancel] = useMutation(CANCEL_STAY_BOOKING),
		list = result.data?.getOwnerBookings.list || [],
		total = result.data?.getOwnerBookings.metaCounter?.[0]?.total || 0;
	const apply = async () => {
		if (!target || lock.current || user.memberType !== MemberType.HOTEL_OWNER) return;
		lock.current = true;
		setBusy(true);
		setError('');
		try {
			const current = await client.query<{ getOwnerBooking: Booking }>({
				query: OWNER_BOOKING,
				variables: { bookingId: target.booking._id },
				fetchPolicy: 'network-only',
			});
			if (!reservationActions(current.data.getOwnerBooking)[target.action])
				throw new Error('Only eligible bookings can change');
			await { confirm, complete, cancel }[target.action]({ variables: { bookingId: target.booking._id } });
			setTarget(undefined);
		} catch (e) {
			setError(ownerError(e));
		} finally {
			try {
				await refresh();
			} catch {
				setError('Refresh reservations to see their latest status.');
			}
			lock.current = false;
			setBusy(false);
		}
	};
	return (
		<section className="h-owner-section">
			<div className="h-owner-section-heading">
				<div>
					<span className="h-eyebrow">Guest stays</span>
					<h2>{compact ? 'Incoming reservations' : 'Reservations'}</h2>
					{!compact && (
						<p>
							{filters.hotelId ? hotel.data?.getOwnerHotel.hotelName || 'Selected property' : 'Across your properties'}
						</p>
					)}
				</div>
				{compact ? (
					<Button variant="text" href="/owner?tab=bookings">
						All reservations →
					</Button>
				) : (
					<Button variant="outlined" disabled={busy} onClick={() => void result.refetch()}>
						Refresh
					</Button>
				)}
			</div>
			{!compact && (
				<>
					<nav className="h-owner-tabs" aria-label="Reservation status">
						{['', ...Object.values(BookingStatus)].map((status) => (
							<Button
								key={status}
								variant={(filters.status || '') === status ? 'contained' : 'text'}
								onClick={() => void change({ status: status || undefined, page: undefined })}
							>
								{status ? label(status) : 'All'}
							</Button>
						))}
					</nav>
					<form
						className="h-owner-date-filter"
						onSubmit={(e) => {
							e.preventDefault();
							void change({ checkIn: checkIn || undefined, checkOut: checkOut || undefined, page: undefined });
						}}
					>
						<Field
							label="Arrival range"
							type="date"
							value={checkIn}
							InputLabelProps={{ shrink: true }}
							onChange={(e) => setCheckIn(e.target.value)}
						/>
						<Field
							label="Departure range"
							type="date"
							value={checkOut}
							InputLabelProps={{ shrink: true }}
							onChange={(e) => setCheckOut(e.target.value)}
						/>
						<Button type="submit" variant="outlined">
							Filter stays
						</Button>
						{(filters.checkIn || filters.hotelId || filters.error) && (
							<Button variant="text" href="/owner?tab=bookings">
								Clear filters
							</Button>
						)}
					</form>
				</>
			)}
			{filters.error ? (
				<EmptyState title={filters.error} />
			) : result.loading ? (
				<EmptyState title="Loading reservations…" />
			) : result.error ? (
				<EmptyState
					error
					title="Reservations unavailable"
					action={<Button onClick={() => void result.refetch()}>Try again</Button>}
				/>
			) : !list.length ? (
				<EmptyState
					title={compact ? 'No incoming requests' : 'No reservations here yet'}
					description="Your next guest journey will appear here."
				/>
			) : (
				<div className="h-owner-reservations">
					{list.map((booking) => {
						const actions = reservationActions(booking, now);
						return (
							<article className="h-owner-reservation" key={booking._id}>
								<SiteImage
									src={booking.roomData?.roomImages?.[0] || booking.hotelData?.hotelImages?.[0]}
									alt={booking.roomData?.roomName || 'Reserved room'}
								/>
								<div>
									<div className="h-owner-badges">
										<span className="h-eyebrow">{booking.hotelData?.hotelName || 'Hotel'}</span>
										<Chip
											tone={
												booking.bookingStatus === 'CANCELLED'
													? 'danger'
													: booking.bookingStatus === 'PENDING'
													? 'warning'
													: 'success'
											}
										>
											{label(booking.bookingStatus)}
										</Chip>
									</div>
									<h3>
										{booking.memberData?.memberNick || 'Guest'} · {booking.roomData?.roomName || 'Room'}
									</h3>
									<p>
										{booking.checkIn.slice(0, 10)} → {booking.checkOut.slice(0, 10)} · {booking.nights} nights
									</p>
									<small>
										{booking.guests} guests · {booking.rooms} rooms ·{' '}
										{booking.hotelData?.hotelTimezone || 'Hotel local dates'}
									</small>
									{booking.bookingStatus === 'PENDING' && !actions.confirm && (
										<p className="h-owner-error">Confirmation window has passed.</p>
									)}
									<div className="h-owner-actions">
										{Object.entries(actions)
											.filter(([, available]) => available)
											.map(([action]) => (
												<Button
													key={action}
													variant={action === 'cancel' ? 'text' : 'outlined'}
													disabled={busy}
													onClick={() => {
														setError('');
														setTarget({ booking, action: action as 'confirm' | 'complete' | 'cancel' });
													}}
												>
													{action === 'confirm'
														? 'Confirm booking'
														: action === 'complete'
														? 'Complete stay'
														: 'Cancel booking'}
												</Button>
											))}
									</div>
								</div>
								<strong className="h-owner-reservation-total">
									{formatUsd(booking.totalPrice)}
									<small>{booking.currency} · stay total</small>
								</strong>
							</article>
						);
					})}
				</div>
			)}
			{!compact && (
				<Pagination page={filters.page} total={total} limit={6} onChange={(p) => void change({ page: String(p) })} />
			)}
			{error && !target && (
				<p role="alert" className="h-owner-error">
					{error}
				</p>
			)}
			<Modal
				title={
					target?.action === 'cancel'
						? 'Cancel this booking?'
						: target?.action === 'complete'
						? 'Complete this stay?'
						: 'Confirm this booking?'
				}
				open={!!target}
				onClose={() => {
					if (!busy) setTarget(undefined);
				}}
			>
				<p>
					{target?.booking.memberData?.memberNick || 'Guest'} · {target?.booking.hotelData?.hotelName}
				</p>
				<p>
					{target?.action === 'cancel'
						? 'The guest’s reservation will be cancelled.'
						: target?.action === 'complete'
						? 'Mark this checked-out stay as completed.'
						: 'Reserve these rooms for the guest.'}
				</p>
				{error && <p role="alert">{error}</p>}
				<div className="h-journal-actions">
					<Button variant="text" disabled={busy} onClick={() => setTarget(undefined)}>
						Keep current status
					</Button>
					<Button disabled={busy} onClick={() => void apply()}>
						{busy ? 'Updating…' : 'Confirm action'}
					</Button>
				</div>
			</Modal>
		</section>
	);
}
