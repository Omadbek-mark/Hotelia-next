import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { OWNER_DASHBOARD } from '../../../apollo/hotelia/owner';
import { userVar } from '../../../apollo/store';
import { OwnerDashboard as Dashboard } from '../../types/hotelia/contracts';
import { MemberType } from '../../types/hotelia/enums';
import { OwnerHotels, OwnerRooms } from './OwnerInventory';
import OwnerReservations from './OwnerReservations';
import DashboardLayout, { ownerNavigation } from './DashboardLayout';
import { OwnerHotelEditor, OwnerRoomEditor } from './OwnerEditors';
import { Button, EmptyState, formatUsd } from './ui';
export function OwnerOverview() {
	const user = useReactiveVar(userVar),
		result = useQuery<{ getOwnerDashboard: Dashboard }>(OWNER_DASHBOARD, {
			skip: user.memberType !== MemberType.HOTEL_OWNER,
			fetchPolicy: 'network-only',
		}),
		data = result.data?.getOwnerDashboard;
	return (
		<>
			<header className="h-owner-heading">
				<div>
					<span className="h-eyebrow">Partner console</span>
					<h1>Your host workspace</h1>
					<p>Considered stays. Effortless hosting.</p>
				</div>
				<Button href="/owner/hotel">Add hotel +</Button>
			</header>
			{result.loading ? (
				<div className="h-owner-metrics" role="status">
					Loading your overview…
				</div>
			) : result.error || !data ? (
				<EmptyState
					error
					title="Overview unavailable"
					action={<Button onClick={() => void result.refetch()}>Refresh overview</Button>}
				/>
			) : (
				<div className="h-owner-metrics">
					{[
						['Registered hotels', data.totalHotels],
						['Rooms in inventory', data.totalRooms],
						['Reservations', data.totalBookings],
						['Completed stay revenue', formatUsd(data.totalRevenue)],
					].map(([title, value]) => (
						<div key={title}>
							<span>{title}</span>
							<strong>{value}</strong>
							{title === 'Completed stay revenue' && <small>{data.currency} · completed stays only</small>}
						</div>
					))}
				</div>
			)}
			<OwnerHotels compact />
			<OwnerReservations compact />
		</>
	);
}
export default function OwnerWorkspace({ editor }: { editor?: 'hotel' | 'room' }) {
	const router = useRouter(),
		user = useReactiveVar(userVar),
		tab = router.query.tab || 'overview',
		valid = typeof tab === 'string' && ['overview', 'hotels', 'rooms', 'bookings'].includes(tab);
	return (
		<DashboardLayout
			title={editor === 'hotel' ? 'Hotel setup' : editor === 'room' ? 'Room setup' : 'Host workspace'}
			role={MemberType.HOTEL_OWNER}
			navigation={ownerNavigation}
		>
			<div className="h-owner" key={user._id}>
				{editor === 'hotel' ? (
					<OwnerHotelEditor />
				) : editor === 'room' ? (
					<OwnerRoomEditor />
				) : !valid ? (
					<EmptyState title="This workspace page is unavailable" action={<Button href="/owner">Overview</Button>} />
				) : tab === 'hotels' ? (
					<OwnerHotels />
				) : tab === 'rooms' ? (
					<OwnerRooms />
				) : tab === 'bookings' ? (
					<OwnerReservations />
				) : (
					<OwnerOverview />
				)}
			</div>
		</DashboardLayout>
	);
}
