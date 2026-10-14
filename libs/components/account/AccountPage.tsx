import { useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { updateUserInfo } from '../../auth/index';
import { EmptyState } from '../common/ui';
import ArticleEditor from '../journal/ArticleEditor';
import Journal from '../journal/Journal';
import AccountLayout from '../layout/AccountLayout';
import withLayoutBasic from '../layout/LayoutBasic';
import Connections from './Connections';
import MyProfile from './MyProfile';
import MyTrips from './MyTrips';
import StayCollection from './StayCollection';

function MyPage() {
	const user = useReactiveVar(userVar),
		router = useRouter();
	const category = router.query.category ?? 'myProfile';
	const [ready, setReady] = useState(false);
	useEffect(() => {
		let active = true;
		void updateUserInfo().finally(() => {
			if (active) setReady(true);
		});
		return () => {
			active = false;
		};
	}, []);
	if (!ready)
		return (
			<div className="h-container h-empty" role="status">
				Opening your account…
			</div>
		);
	if (!user._id)
		return (
			<EmptyState
				title="Log in to continue"
				action={
					<Link className="h-text-link" href={`/account/join?referrer=${encodeURIComponent(router.asPath)}`}>
						Log in
					</Link>
				}
			/>
		);
	if (category === 'myBookings')
		return (
			<AccountLayout>
				<MyTrips />
			</AccountLayout>
		);
	if (category === 'followers' || category === 'followings')
		return (
			<AccountLayout>
				<Connections key={`${user._id}:${category}`} memberId={user._id} kind={category} account />
			</AccountLayout>
		);
	if (category === 'myFavorites' || category === 'recentlyVisited')
		return (
			<AccountLayout>
				<StayCollection key={category} kind={category === 'myFavorites' ? 'saved' : 'viewed'} />
			</AccountLayout>
		);
	if (category === 'myProfile')
		return (
			<AccountLayout>
				<MyProfile />
			</AccountLayout>
		);
	if (category === 'myArticles' || category === 'writeArticle')
		return (
			<AccountLayout>{category === 'myArticles' ? <Journal own key={user._id} /> : <ArticleEditor />}</AccountLayout>
		);
	if (['myHotels', 'addHotel', 'ownerBookings'].includes(String(category)))
		return <OwnerRedirect category={String(category)} />;
	return <EmptyState title="Page unavailable" action={<Link href="/account?category=myProfile">My profile</Link>} />;
}
function OwnerRedirect({ category }: { category: string }) {
	const router = useRouter();
	useEffect(() => {
		void router.replace(
			category === 'addHotel'
				? '/owner/hotel'
				: category === 'ownerBookings'
				? '/owner?tab=bookings'
				: '/owner?tab=hotels',
		);
	}, [category, router]);
	return <EmptyState title="Opening your host workspace…" />;
}
export default withLayoutBasic(MyPage);
