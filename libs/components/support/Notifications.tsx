import { useApolloClient, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { GET_NOTIFICATIONS, GET_UNREAD_COUNT, MARK_NOTIFICATION_READ } from '../../../apollo/user/support';
import { NotificationStatus } from '../../enums';
import { isMemberId } from '../../social/query';
import { Notifications as NotificationList } from '../../types/contracts';
import { Button, Chip, EmptyState, Pagination } from '../common/ui';
export default function Notifications({ page, onPage }: { page: number; onPage: (page: number) => void }) {
	const user = useReactiveVar(userVar),
		client = useApolloClient(),
		[read] = useMutation(MARK_NOTIFICATION_READ),
		lock = useRef(false),
		[busy, setBusy] = useState(''),
		[error, setError] = useState('');
	const result = useQuery<{ getMyNotifications: NotificationList }>(GET_NOTIFICATIONS, {
		variables: { input: { page, limit: 10 } },
		skip: !user._id,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	async function mark(id: string) {
		if (lock.current || !user._id) return;
		const owner = user._id;
		lock.current = true;
		setBusy(id);
		setError('');
		try {
			await read({ variables: { notificationId: id } });
			if (userVar()._id !== owner) return;
			const refresh = await Promise.allSettled([
				result.refetch(),
				client.refetchQueries({ include: [GET_UNREAD_COUNT] }),
			]);
			if (refresh.some((item) => item.status === 'rejected'))
				setError('Read status saved. Refresh the page to load the latest updates.');
		} catch {
			if (userVar()._id === owner) setError('Could not confirm the read status. Please retry.');
		} finally {
			lock.current = false;
			setBusy('');
		}
	}
	if (result.loading) return <EmptyState title="Opening your updates…" />;
	if (result.error)
		return (
			<EmptyState
				error
				title="Updates are taking a moment"
				action={<Button onClick={() => void result.refetch()}>Retry</Button>}
			/>
		);
	const data = result.data?.getMyNotifications;
	return (
		<section className="h-notifications">
			<h2>Your latest updates</h2>
			{error && <p role="alert">{error}</p>}
			{data?.list.length ? (
				data.list.map((item) => (
					<article className="h-notification" key={item._id}>
						<div>
							<Chip tone={item.notificationStatus === NotificationStatus.WAIT ? 'warning' : 'neutral'}>
								{item.notificationStatus === NotificationStatus.WAIT ? 'Unread' : 'Read'}
							</Chip>
							<small>
								{new Date(item.createdAt).toLocaleDateString('en-US', {
									timeZone: 'UTC',
									month: 'short',
									day: 'numeric',
								})}
							</small>
							<h3>{item.notificationTitle}</h3>
							{item.notificationDesc && <p>{item.notificationDesc}</p>}
							<div className="h-notification-actions">
								{item.bookingId ? (
									<Button
										variant="text"
										href={user.memberType === 'HOTEL_OWNER' ? '/owner?tab=bookings' : '/account?category=myBookings'}
									>
										View reservations
									</Button>
								) : isMemberId(item.hotelId) ? (
									<Button variant="text" href={`/hotel/detail?hotelId=${item.hotelId}`}>
										View hotel
									</Button>
								) : null}
								{item.notificationStatus === NotificationStatus.WAIT && (
									<Button variant="outlined" disabled={!!busy} onClick={() => void mark(item._id)}>
										{busy === item._id ? 'Updating…' : 'Mark as read'}
									</Button>
								)}
							</div>
						</div>
					</article>
				))
			) : (
				<EmptyState title="All quiet for now" description="Your booking and hotel updates will appear here." />
			)}
			<Pagination page={page} total={data?.metaCounter?.[0]?.total || 0} limit={10} onChange={onPage} />
		</section>
	);
}
