import Link from 'next/link';
import { ADMIN_HOTELS, ADMIN_HOTEL_UPDATE } from '../../../apollo/admin/admin';
import { HotelStatus } from '../../enums';
import { Hotels } from '../../types/contracts';
import { Pagination, SiteImage } from '../common/ui';
import {
	AdminFilters,
	AdminHeading,
	AdminState,
	StatusMenu,
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
							<StatusMenu
								value={h.hotelStatus}
								name={h.hotelName}
								options={Object.values(HotelStatus)}
								disabled={action.busy || h.hotelStatus === HotelStatus.DELETE}
								onChange={(status) =>
									action.open({
										title: `Set ${h.hotelName} to ${status.toLowerCase()}?`,
										description:
											status === HotelStatus.DELETE
												? 'Archive this hotel. Active reservations must be resolved first. Deleted records cannot be reactivated.'
												: status === HotelStatus.PAUSED
												? 'Stop new bookings. Existing reservations remain available.'
												: 'Allow available booking requests again.',
										variables: { input: { _id: h._id, hotelStatus: status } },
									})
								}
							/>
							<div className="h-admin-actions">
								<Link href={{ pathname: '/_admin/rooms', query: { hotelId: h._id } }}>Rooms ↗</Link>
								<Link href={{ pathname: '/_admin/bookings', query: { hotelId: h._id } }}>Reservations ↗</Link>
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
