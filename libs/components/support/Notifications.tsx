import { useApolloClient, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Tab, Tabs } from '@mui/material';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import { useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import {
	GET_NOTIFICATIONS,
	GET_UNREAD_COUNT,
	GET_UNREAD_COUNTS,
	MARK_NOTIFICATION_READ,
} from '../../../apollo/user/support';
import { NotificationStatus, NotificationType } from '../../enums';
import { isMemberId } from '../../social/query';
import { Notifications as NotificationList } from '../../types/contracts';
import { Button, EmptyState, Pagination } from '../common/ui';

const bookingTypes = [
	NotificationType.BOOKING_CREATED,
	NotificationType.BOOKING_CONFIRMED,
	NotificationType.BOOKING_CANCELLED,
	NotificationType.BOOKING_COMPLETED,
];
const personalTypes = [
	NotificationType.SUPPORT_MESSAGE,
	NotificationType.REVIEW,
	NotificationType.LIKE,
	NotificationType.COMMENT,
	NotificationType.FOLLOW,
];
const adminTabs = [
	{
		label: 'Hotels / Rooms',
		types: [NotificationType.HOTEL_CREATED, NotificationType.ROOM_CREATED],
		icon: <ApartmentOutlinedIcon />,
	},
	{ label: 'Booking', types: bookingTypes, icon: <EventAvailableOutlinedIcon /> },
	{ label: 'Personal messages', types: personalTypes, icon: <ChatBubbleOutlineIcon /> },
];
const ownerTabs = [
	{ label: 'Booking', types: bookingTypes, icon: <EventAvailableOutlinedIcon /> },
	{ label: 'Reviews', types: personalTypes, icon: <StarOutlineIcon /> },
];

export default function Notifications({ page, onPage }: { page: number; onPage: (page: number) => void }) {
	const user = useReactiveVar(userVar),
		client = useApolloClient();
	const [read] = useMutation(MARK_NOTIFICATION_READ);
	const pending = useRef(new Set<string>());
	const [error, setError] = useState('');
	const [selected, setSelected] = useState(0);
	const [readIds, setReadIds] = useState<string[]>([]);
	const admin = user.memberType === 'ADMIN';
	const tabs = admin ? adminTabs : user.memberType === 'HOTEL_OWNER' ? ownerTabs : [];
	const current = tabs[selected];
	const counts = useQuery<{ getUnreadNotificationCounts: { notificationType: NotificationType; total: number }[] }>(
		GET_UNREAD_COUNTS,
		{
			skip: !user._id || !tabs.length,
			fetchPolicy: 'network-only',
			pollInterval: 30000,
		},
	);
	const result = useQuery<{ getMyNotifications: NotificationList }>(GET_NOTIFICATIONS, {
		variables: { input: { page, limit: 10, ...(current ? { notificationTypes: current.types } : {}) } },
		pollInterval: 30000,
		skip: !user._id,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	async function mark(id: string, status: NotificationStatus) {
		if (status === NotificationStatus.READ || readIds.includes(id) || pending.current.has(id) || !user._id) return;
		const memberId = user._id;
		pending.current.add(id);
		setError('');
		try {
			await read({ variables: { notificationId: id } });
			if (userVar()._id !== memberId) return;
			setReadIds((ids) => [...ids, id]);
			const refresh = await Promise.allSettled([
				client.refetchQueries({ include: [GET_UNREAD_COUNT, GET_UNREAD_COUNTS] }),
			]);
			if (refresh.some((item) => item.status === 'rejected'))
				setError('Read status saved. Counts will update when the connection returns.');
		} catch {
			if (userVar()._id === memberId) setError('Could not save the read status. Tap the message to retry.');
		} finally {
			pending.current.delete(id);
		}
	}
	const data = result.data?.getMyNotifications;
	return (
		<section className="h-notifications">
			<div className="h-notifications-heading">
				<h2>Notifications</h2>
				<p>Your latest updates, all in one place.</p>
			</div>
			{!!tabs.length && (
				<Tabs
					className="h-notification-tabs"
					value={selected}
					variant="scrollable"
					scrollButtons="auto"
					aria-label="Notification categories"
					onChange={(_, value: number) => {
						setSelected(value);
						setError('');
						onPage(1);
					}}
				>
					{tabs.map((tab, index) => {
						const total = (counts.data?.getUnreadNotificationCounts || []).reduce(
							(sum, row) => sum + (tab.types.includes(row.notificationType) ? row.total : 0),
							0,
						);
						return (
							<Tab
								key={tab.label}
								id={`notification-tab-${index}`}
								aria-controls="notification-panel"
								icon={tab.icon}
								iconPosition="start"
								aria-label={`${tab.label}${total ? `, ${total} unread` : ''}`}
								label={
									<span className="h-notification-tab-label">
										{tab.label}
										{total > 0 && (
											<span className="h-notification-tab-count" aria-hidden="true">
												{total > 99 ? '99+' : total}
											</span>
										)}
										{counts.error && (
											<span className="h-notification-count-unknown" aria-label="Unread count unavailable">
												•
											</span>
										)}
									</span>
								}
							/>
						);
					})}
				</Tabs>
			)}
			{error && (
				<p className="h-notification-error" role="alert">
					{error}
				</p>
			)}
			<div
				id="notification-panel"
				role={tabs.length ? 'tabpanel' : undefined}
				aria-labelledby={tabs.length ? `notification-tab-${selected}` : undefined}
			>
				{result.error ? (
					<EmptyState
						error
						title="Updates are taking a moment"
						action={<Button onClick={() => void result.refetch()}>Retry</Button>}
					/>
				) : result.loading && !data ? (
					<EmptyState title="Opening your updates…" />
				) : data?.list.length ? (
					data.list.map((item) => {
						const unread = item.notificationStatus === NotificationStatus.WAIT && !readIds.includes(item._id);
						const icon =
							item.notificationGroup === 'BOOKING' ? (
								<EventAvailableOutlinedIcon />
							) : item.notificationType === NotificationType.REVIEW ? (
								<StarOutlineIcon />
							) : item.notificationGroup === 'SUPPORT' ? (
								<ChatBubbleOutlineIcon />
							) : (
								<ApartmentOutlinedIcon />
							);
						const action =
							item.inquiryId && admin
								? { href: '/_admin/support/inquiry', label: 'View message' }
								: item.roomId && admin && !item.bookingId
								? { href: `/_admin/rooms?hotelId=${item.hotelId}`, label: 'View rooms' }
								: item.bookingId
								? {
										href: admin
											? '/_admin/bookings'
											: user.memberType === 'HOTEL_OWNER'
											? '/owner?tab=bookings'
											: '/account?category=myBookings',
										label: 'View booking',
								  }
								: isMemberId(item.hotelId)
								? { href: `/hotel/detail?hotelId=${item.hotelId}`, label: 'View hotel' }
								: null;
						return (
							<article
								className={`h-notification ${unread ? 'h-notification--unread' : 'h-notification--read'}`}
								key={item._id}
								onClick={() => void mark(item._id, item.notificationStatus)}
							>
								<button
									type="button"
									className="h-notification-body"
									aria-label={`${unread ? 'Unread: ' : ''}${item.notificationTitle}${
										unread ? '. Click to mark as read' : ''
									}`}
								>
									<span className="h-notification-icon" aria-hidden="true">
										{icon}
									</span>
									<span className="h-notification-copy">
										<span className="h-notification-meta">
											<time dateTime={item.createdAt}>
												{new Date(item.createdAt).toLocaleDateString('en-US', {
													timeZone: 'UTC',
													month: 'short',
													day: 'numeric',
												})}
											</time>
											{unread && <span className="h-notification-dot" aria-hidden="true" />}
										</span>
										<span className="h-notification-title">{item.notificationTitle}</span>
										{item.notificationDesc && (
											<span className="h-notification-description">{item.notificationDesc}</span>
										)}
									</span>
								</button>
								{action && (
									<div className="h-notification-actions">
										<Button variant="text" href={action.href}>
											{action.label} ↗
										</Button>
									</div>
								)}
							</article>
						);
					})
				) : (
					<EmptyState
						title="All quiet for now"
						description={
							current
								? `Your ${current.label.toLowerCase()} updates will appear here.`
								: 'Your latest updates will appear here.'
						}
					/>
				)}
				<Pagination page={page} total={data?.metaCounter?.[0]?.total || 0} limit={10} onChange={onPage} />
			</div>
		</section>
	);
}
