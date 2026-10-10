import { useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { userVar } from '../../../apollo/store';
import { MemberType } from '../../enums';
import { Button, EmptyState } from '../common/ui';
import DashboardLayout, { ownerNavigation } from '../layout/DashboardLayout';
import { OwnerHotelEditor } from './OwnerHotelEditor';
import { OwnerHotels } from './OwnerHotels';
import { OwnerOverview } from './OwnerOverview';
import OwnerReservations from './OwnerReservations';
import { OwnerRoomEditor } from './OwnerRoomEditor';
import { OwnerRooms } from './OwnerRooms';

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
