import { useRouter } from 'next/router';
import { EmptyState } from '../common/ui';
import withAdminLayout from '../layout/LayoutAdmin';
function AdminPage() {
	const router = useRouter();
	const section = router.pathname.split('/').pop() || 'overview';
	return (
		<EmptyState
			title="Hotelia administration"
			description={`The ${
				section === '_admin' ? 'overview' : section === 'properties' ? 'hotels' : section
			} workspace is planned for the administration stage.`}
		/>
	);
}
export default withAdminLayout(AdminPage);
