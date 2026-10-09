import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Stack } from '@mui/material';
import { useReactiveVar } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyProperties from '../../libs/components/mypage/MyProperties';
import AddProperty from '../../libs/components/mypage/AddNewProperty';
import MyProfile from '../../libs/components/mypage/MyProfile';
import MyArticles from '../../libs/components/mypage/MyArticles';
import MyMenu from '../../libs/components/mypage/MyMenu';
import WriteArticle from '../../libs/components/mypage/WriteArticle';
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
	const device = useDeviceDetect(),
		user = useReactiveVar(userVar),
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
	if (device === 'mobile') return <div>MY PAGE</div>;
	return (
		<div id="my-page" style={{ position: 'relative' }}>
			<div className="container">
				<Stack className="my-page">
					<Stack className="back-frame">
						<Stack className="left-config">
							<MyMenu />
						</Stack>
						<Stack className="main-config" mb="76px">
							<Stack className="list-config">
								{category === 'addProperty' && <AddProperty />}
								{category === 'myProperties' && <MyProperties />}
								{category === 'myArticles' && <MyArticles />}
								{category === 'writeArticle' && <WriteArticle />}
							</Stack>
						</Stack>
					</Stack>
				</Stack>
			</div>
		</div>
	);
}
export default withLayoutBasic(MyPage);
