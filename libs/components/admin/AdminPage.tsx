import { useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { userVar } from '../../../apollo/store';
import { AdminSection } from '../../admin/model';
import withAdminLayout from '../layout/LayoutAdmin';
import AdminOverview from './AdminOverview';
import AdminHotels from './AdminHotels';
import AdminMembers from './AdminMembers';
import AdminJournal from './AdminJournal';
import AdminSupport from './AdminSupport';
import AdminRooms from './AdminRooms';
import AdminBookings from './AdminBookings';
function AdminContent() {
	const router = useRouter(),
		section = (router.pathname.split('/').pop() || 'overview') as AdminSection;
	if (section === 'hotels') return <AdminHotels />;
	if (section === 'users') return <AdminMembers />;
	if (section === 'journal') return <AdminJournal />;
	if (section === 'rooms') return <AdminRooms />;
	if (section === 'bookings') return <AdminBookings />;
	if (['faq', 'notice', 'inquiry'].includes(section)) return <AdminSupport key={section} section={section} />;
	return <AdminOverview />;
}
function AdminPage() {
	const user = useReactiveVar(userVar);
	return (
		<div className="h-admin" key={user._id}>
			<AdminContent />
		</div>
	);
}
export default withAdminLayout(AdminPage);
