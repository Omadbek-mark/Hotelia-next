import Link from 'next/link';
import { ADMIN_HOTELS, ADMIN_HOTEL_UPDATE } from '../../../apollo/admin/admin';
import { HotelStatus } from '../../enums';
import { Hotels } from '../../types/contracts';
import { Button, Pagination, SiteImage } from '../common/ui';
import {
	AdminFilters,
	AdminHeading,
	AdminState,
	Status,
	useAdminAction,
	useAdminFilters,
	useAdminList,
} from './shared';
export default function AdminHotels() {
	const filters = useAdminFilters('hotels'),
		query = useAdminList<{ getAllHotelsByAdmin: Hotels }>(
			ADMIN_HOTELS,
			{
				page: filters.page,
				limit: 10,
				sort: 'NEWEST',
				...(filters.status ? { hotelStatus: filters.status } : {}),
				search: filters.text ? { text: filters.text } : {},
			},
			filters.valid,
		),
		rows = query.data?.getAllHotelsByAdmin;
	const action = useAdminAction(ADMIN_HOTEL_UPDATE, () => query.refetch());
	return (
		<>
			<AdminHeading title="Hotel moderation" description="Keep every stay in view." />
			<AdminFilters section="hotels" filters={filters} />
			{action.ui}
			<AdminState
				valid={filters.valid}
				loading={query.loading}
				error={query.error}
				empty={!rows?.list.length}
				refresh={() => query.refetch()}
			>
				<div className="h-admin-ledger">
					{rows?.list.map((h) => (
						<article className="h-admin-row" key={h._id}>
							<SiteImage src={h.hotelImages[0]} alt={h.hotelName} className="h-admin-thumbnail" />
							<div className="h-admin-record">
								<h2>{h.hotelName}</h2>
								<p>
									{h.hotelCity}, {h.hotelCountry}
								</p>
								<small>
									{h.memberData?.memberNick || 'Hotel owner'} · {h.hotelType.toLowerCase().replace(/_/g, ' ')}
								</small>
							</div>
							<Status value={h.hotelStatus} />
							<div className="h-admin-actions">
								<Link href={{ pathname: '/_admin/rooms', query: { hotelId: h._id } }}>Rooms ↗</Link>
								<Link href={{ pathname: '/_admin/bookings', query: { hotelId: h._id } }}>Reservations ↗</Link>
								{h.hotelStatus !== HotelStatus.DELETE && (
									<Button
										variant="outlined"
										disabled={action.busy}
										onClick={() => {
											const status = h.hotelStatus === HotelStatus.ACTIVE ? HotelStatus.PAUSED : HotelStatus.ACTIVE;
											action.open({
												title: `${status === HotelStatus.PAUSED ? 'Pause' : 'Activate'} ${h.hotelName}?`,
												description:
													status === HotelStatus.PAUSED
														? 'This hotel will stop appearing in available stays. Existing reservations remain in the reservation workspace.'
														: 'This hotel can appear in available stays again.',
												variables: { input: { _id: h._id, hotelStatus: status } },
											});
										}}
									>
										{h.hotelStatus === HotelStatus.ACTIVE ? 'Pause hotel' : 'Activate hotel'}
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
