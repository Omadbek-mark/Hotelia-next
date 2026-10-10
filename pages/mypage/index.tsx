import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyProfile from '../../libs/components/mypage/MyProfile';
import Journal from '../../libs/components/hotelia/Journal';
import ArticleEditor from '../../libs/components/hotelia/ArticleEditor';
import { userVar } from '../../apollo/store';
import { updateUserInfo } from '../../libs/auth';
import AccountLayout from '../../libs/components/hotelia/AccountLayout';
import { EmptyState } from '../../libs/components/hotelia/ui';
import MyTrips from '../../libs/components/hotelia/MyTrips';
import StayCollection from '../../libs/components/hotelia/StayCollection';
import Connections from '../../libs/components/hotelia/Connections';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

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
				title="Sign in to continue"
				action={
					<Link className="h-text-link" href={`/account/join?referrer=${encodeURIComponent(router.asPath)}`}>
						Sign in
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
	if (['myProperties', 'addProperty', 'ownerBookings'].includes(String(category)))
		return <OwnerRedirect category={String(category)} />;
	return <EmptyState title="Page unavailable" action={<Link href="/mypage?category=myProfile">My profile</Link>} />;
}
function OwnerRedirect({ category }: { category: string }) {
	const router = useRouter();
	useEffect(() => {
		void router.replace(
			category === 'addProperty'
				? '/owner/hotel'
				: category === 'ownerBookings'
				? '/owner?tab=bookings'
				: '/owner?tab=hotels',
		);
	}, [category, router]);
	return <EmptyState title="Opening your host workspace…" />;
}
export default withLayoutBasic(MyPage);
