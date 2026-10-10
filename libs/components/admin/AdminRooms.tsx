import Link from 'next/link';
import { ADMIN_ROOMS, ADMIN_ROOM_UPDATE } from '../../../apollo/admin/admin';
import { RoomStatus } from '../../enums';
import { Rooms } from '../../types/contracts';
import { Button, Pagination, SiteImage, formatUsd } from '../common/ui';
import {
	AdminFilters,
	AdminHeading,
	AdminState,
	Status,
	useAdminAction,
	useAdminFilters,
	useAdminList,
} from './shared';
export default function AdminRooms() {
	const filters = useAdminFilters('rooms'),
		query = useAdminList<{ getAllRoomsByAdmin: Rooms }>(
			ADMIN_ROOMS,
			{
				page: filters.page,
				limit: 10,
				sort: 'NEWEST',
				...(filters.status ? { roomStatus: filters.status } : {}),
				...(filters.hotelId ? { hotelId: filters.hotelId } : {}),
			},
			filters.valid,
		),
		rows = query.data?.getAllRoomsByAdmin,
		action = useAdminAction(ADMIN_ROOM_UPDATE, () => query.refetch());
	return (
		<>
			<AdminHeading
				title="Room inventory"
				description={filters.hotelId ? 'Rooms for the selected hotel.' : 'Rooms across Hotelia.'}
				action={filters.hotelId ? <Link href="/_admin/rooms">All rooms ↗</Link> : undefined}
			/>
			<AdminFilters section="rooms" filters={filters} />
			{action.ui}
			<AdminState
				valid={filters.valid}
				loading={query.loading}
				error={query.error}
				empty={!rows?.list.length}
				refresh={() => query.refetch()}
			>
				<div className="h-admin-ledger">
					{rows?.list.map((r) => (
						<article className="h-admin-row" key={r._id}>
							<SiteImage src={r.roomImages[0]} alt={r.roomName} className="h-admin-thumbnail" />
							<div className="h-admin-record">
								<h2>{r.roomName}</h2>
								<p>{formatUsd(r.roomPrice)} / night</p>
								<small>
									{r.roomCapacity} guests · {r.roomQuantity} rooms
								</small>
							</div>
							<Status value={r.roomStatus} />
							<div className="h-admin-actions">
								<Link href={{ pathname: '/_admin/bookings', query: { hotelId: r.hotelId } }}>Hotel reservations ↗</Link>
								{r.roomStatus !== RoomStatus.DELETE && (
									<Button
										variant="outlined"
										disabled={action.busy}
										onClick={() => {
											const status = r.roomStatus === RoomStatus.ACTIVE ? RoomStatus.PAUSED : RoomStatus.ACTIVE;
											action.open({
												title: `${status === RoomStatus.PAUSED ? 'Pause' : 'Activate'} ${r.roomName}?`,
												description:
													status === RoomStatus.PAUSED
														? 'This room will stop accepting new booking requests.'
														: 'This room can accept available booking requests again.',
												variables: { input: { _id: r._id, roomStatus: status } },
											});
										}}
									>
										{r.roomStatus === RoomStatus.ACTIVE ? 'Pause room' : 'Activate room'}
									</Button>
								)}
							</div>
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
