import { useQuery, useReactiveVar } from '@apollo/client';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import Link from 'next/link';
import { userVar } from '../../../apollo/store';
import { GET_UNREAD_COUNT } from '../../../apollo/user/support';
export default function NotificationLink() {
	const user = useReactiveVar(userVar),
		{ data } = useQuery<{ getUnreadNotificationCount: number }>(GET_UNREAD_COUNT, {
			skip: !user._id,
			fetchPolicy: 'network-only',
			pollInterval: 60000,
		});
	if (!user._id) return null;
	const count = data?.getUnreadNotificationCount;
	return (
		<Link
			className="h-notification-link"
			href="/support?tab=notifications"
			aria-label={count === undefined ? 'Notifications' : `Notifications, ${count} unread`}
		>
			<NotificationsNoneIcon fontSize="small" />
			{!!count && <span>{count > 99 ? '99+' : count}</span>}
		</Link>
	);
}
