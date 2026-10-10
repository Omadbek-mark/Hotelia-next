import Link from 'next/link';
import { ADMIN_BOOKINGS, ADMIN_CANCEL_BOOKING } from '../../../apollo/admin/admin';
import { BookingStatus } from '../../enums';
import { Bookings } from '../../types/contracts';
import { Button, Pagination, formatUsd } from '../common/ui';
import {
	AdminFilters,
	AdminHeading,
	AdminState,
	Status,
	useAdminAction,
	useAdminFilters,
	useAdminList,
} from './shared';
export default function AdminBookings() {
	const filters = useAdminFilters('bookings'),
		query = useAdminList<{ getAllBookingsByAdmin: Bookings }>(
			ADMIN_BOOKINGS,
			{
				page: filters.page,
				limit: 10,
				...(filters.status ? { bookingStatus: filters.status } : {}),
				...(filters.hotelId ? { hotelId: filters.hotelId } : {}),
			},
			filters.valid,
		),
		rows = query.data?.getAllBookingsByAdmin,
		action = useAdminAction(ADMIN_CANCEL_BOOKING, () => query.refetch());
	return (
		<>
			<AdminHeading
				title="Reservations"
				description={filters.hotelId ? 'Stays for the selected hotel.' : 'Every stay, in one place.'}
				action={filters.hotelId ? <Link href="/_admin/bookings">All reservations ↗</Link> : undefined}
			/>
			<AdminFilters section="bookings" filters={filters} />
			{action.ui}
			<AdminState
				valid={filters.valid}
				loading={query.loading}
				error={query.error}
				empty={!rows?.list.length}
				refresh={() => query.refetch()}
			>
				<div className="h-admin-ledger">
					{rows?.list.map((b) => (
						<article className="h-admin-row h-admin-reservation" key={b._id}>
							<div className="h-admin-record">
								<span className="h-eyebrow">{b.memberData?.memberNick || 'Guest'}</span>
								<h2>{b.hotelData?.hotelName || 'Hotel'}</h2>
								<p>
									{b.roomData?.roomName || 'Room'} · {b.checkIn.slice(0, 10)} — {b.checkOut.slice(0, 10)}
								</p>
								<small>
									{b.guests} guests · {b.rooms} rooms · {b.nights} nights
								</small>
								<small>Reference {b._id}</small>
							</div>
							<strong>{b.currency === 'USD' ? formatUsd(b.totalPrice) : `${b.totalPrice} ${b.currency}`}</strong>
							<Status value={b.bookingStatus} />
							{[BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(b.bookingStatus) && (
								<Button
									variant="outlined"
									disabled={action.busy}
									onClick={() =>
										action.open({
											title: 'Cancel this reservation?',
											description: `Cancel the stay at ${b.hotelData?.hotelName || 'this hotel'} for ${
												b.memberData?.memberNick || 'this guest'
											}? Room availability will be updated.`,
											variables: { bookingId: b._id },
										})
									}
								>
									Cancel reservation
								</Button>
							)}
						</article>
					))}
				</div>
				<Pagination
					page={filters.page}
					total={rows?.metaCounter[0]?.total || 0}
					limit={10}
					onChange={(page) => filters.change({ page })}
				/>
			</AdminState>
		</>
	);
}
