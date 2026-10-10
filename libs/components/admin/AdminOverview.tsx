import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { ADMIN_OVERVIEW } from '../../../apollo/admin/admin';
import { Bookings, Hotels, Members, BoardArticles, AdminSupportNotices } from '../../types/contracts';
import { AdminHeading, AdminState, shortDate, Status } from './shared';
export default function AdminOverview() {
	const query = useQuery<{
		hotels: Hotels;
		members: Members;
		journal: BoardArticles;
		inquiries: AdminSupportNotices;
		bookings: Bookings;
	}>(ADMIN_OVERVIEW, { fetchPolicy: 'network-only', notifyOnNetworkStatusChange: true });
	const data = query.data,
		cards = [
			['Hotels', data?.hotels, '/_admin/hotels'],
			['Members', data?.members, '/_admin/users'],
			['Active stories', data?.journal, '/_admin/journal'],
			['Awaiting reply', data?.inquiries, '/_admin/support/inquiry?status=HOLD'],
		] as const;
	return (
		<>
			<AdminHeading title="A clear perspective." description="Your platform, at a glance." />
			<AdminState loading={query.loading} error={query.error} refresh={() => query.refetch()}>
				<div className="h-admin-stats">
					{cards.map(([title, collection, href]) => (
						<Link href={href} className="h-admin-stat" key={title}>
							<span>{title}</span>
							<strong>{collection?.metaCounter?.[0]?.total ?? 0}</strong>
							<small>Open workspace ↗</small>
						</Link>
					))}
				</div>
				<div className="h-admin-overview-grid">
					<section className="h-admin-panel">
						<div className="h-admin-panel-heading">
							<h2>Latest reservations</h2>
							<Link href="/_admin/bookings">View all ↗</Link>
						</div>
						{data?.bookings.list.length ? (
							data.bookings.list.map((b) => (
								<div className="h-admin-compact" key={b._id}>
									<div>
										<strong>{b.hotelData?.hotelName || 'Hotel'}</strong>
										<small>
											{b.memberData?.memberNick || 'Guest'} · {shortDate(b.checkIn)}
										</small>
									</div>
									<Status value={b.bookingStatus} />
								</div>
							))
						) : (
							<p>No reservations yet.</p>
						)}
					</section>
					<section className="h-admin-panel">
						<div className="h-admin-panel-heading">
							<h2>Waiting for a reply</h2>
							<Link href="/_admin/support/inquiry?status=HOLD">Open inbox ↗</Link>
						</div>
						{data?.inquiries.list.length ? (
							data.inquiries.list.map((i) => (
								<Link href="/_admin/support/inquiry?status=HOLD" className="h-admin-compact" key={i._id}>
									<strong>{i.noticeTitle}</strong>
									<small>{shortDate(i.createdAt)}</small>
								</Link>
							))
						) : (
							<p>Your inbox is clear.</p>
						)}
					</section>
				</div>
				<div className="h-admin-shortcuts">
					{[
						['Room inventory', '/_admin/rooms'],
						['Journal moderation', '/_admin/journal'],
						['Help & notices', '/_admin/support/faq'],
					].map(([title, href]) => (
						<Link key={href} href={href}>
							{title}
							<span>↗</span>
						</Link>
					))}
				</div>
			</AdminState>
		</>
	);
}
