import { useQuery, useReactiveVar } from '@apollo/client';
import { OWNER_DASHBOARD } from '../../../apollo/owner/owner';
import { userVar } from '../../../apollo/store';
import { OwnerDashboard as Dashboard } from '../../types/contracts';
import { MemberType } from '../../enums';
import { Button, EmptyState, formatUsd } from '../common/ui';
import { OwnerHotels } from './OwnerHotels';
import OwnerReservations from './OwnerReservations';

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
