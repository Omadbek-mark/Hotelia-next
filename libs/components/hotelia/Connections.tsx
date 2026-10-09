import { useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Skeleton } from '@mui/material';
import { userVar } from '../../../apollo/store';
import { GET_MEMBER_FOLLOWERS, GET_MEMBER_FOLLOWINGS } from '../../../apollo/hotelia/social';
import type { Followers, Followings, MemberPublic, MeFollowed } from '../../types/hotelia/contracts';
import { isFollowing, isMemberId, socialPage, socialHref } from '../../social/query';
import { Button, EmptyState, Pagination, SiteImage } from './ui';
import FollowButton from './FollowButton';
import { useViewerRefresh } from '../../social/use-viewer-refresh';

export default function Connections({
	memberId,
	kind,
	account = false,
}: {
	memberId: string;
	kind: 'followers' | 'followings';
	account?: boolean;
}) {
	const router = useRouter(),
		user = useReactiveVar(userVar);
	const page = socialPage(router.query.networkPage),
		followers = kind === 'followers';
	const { data, loading, error, refetch } = useQuery<{
		getMemberFollowers?: Followers;
		getMemberFollowings?: Followings;
	}>(followers ? GET_MEMBER_FOLLOWERS : GET_MEMBER_FOLLOWINGS, {
		variables: {
			input: { page: page || 1, limit: 6, search: followers ? { followingId: memberId } : { followerId: memberId } },
		},
		skip: !router.isReady || !isMemberId(memberId) || !page,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	useViewerRefresh(refetch, router.isReady && isMemberId(memberId) && !!page);
	const collection = followers ? data?.getMemberFollowers : data?.getMemberFollowings;
	const people: { member: MemberPublic; records?: MeFollowed[] | null; key: string }[] = followers
		? (data?.getMemberFollowers?.list || []).flatMap((item) =>
				item.followerData ? [{ member: item.followerData, records: item.meFollowed, key: item._id }] : [],
		  )
		: (data?.getMemberFollowings?.list || []).flatMap((item) =>
				item.followingData ? [{ member: item.followingData, records: item.meFollowed, key: item._id }] : [],
		  );
	const total = collection?.metaCounter?.[0]?.total || 0;
	const href = (category: string, next = '1') =>
		socialHref(account ? '/mypage' : '/member', { ...(account ? {} : { memberId }), category, networkPage: next });
	const Heading = account ? 'h1' : 'h2';
	return (
		<section className="h-connections">
			<Head>
				<title>{followers ? 'Followers' : 'Following'} · Hotelia</title>
			</Head>
			<div className="h-social-heading">
				<span className="h-eyebrow">Your Hotelia circle</span>
				<Heading>Community connections.</Heading>
				<p>People worth staying connected to.</p>
			</div>
			<div className="h-social-tabs">
				{account && (
					<>
						<Link aria-current={followers ? 'page' : undefined} href={href('followers')}>
							Followers
						</Link>
						<Link aria-current={!followers ? 'page' : undefined} href={href('followings')}>
							Following
						</Link>
					</>
				)}
				<Button
					variant="text"
					disabled={loading || !page}
					onClick={() => {
						void refetch().catch(() => {});
					}}
				>
					Refresh
				</Button>
			</div>
			<p className="h-social-count" aria-live="polite">
				{loading ? 'Opening your circle…' : `${total} ${total === 1 ? 'connection' : 'connections'}`}
			</p>
			{!page ? (
				<EmptyState error title="Check your page" action={<Button href={href(kind)}>First page</Button>} />
			) : loading || !router.isReady ? (
				<Skeleton variant="rectangular" height={260} />
			) : error ? (
				<EmptyState
					error
					title="Connections could not load"
					action={
						<Button
							onClick={() => {
								void refetch().catch(() => {});
							}}
						>
							Try again
						</Button>
					}
				/>
			) : !people.length ? (
				<EmptyState
					title={
						page > 1 ? 'No connections on this page' : followers ? 'A growing circle' : 'Meet your next inspiration'
					}
					action={<Button href={page > 1 ? href(kind) : '/agent'}>{page > 1 ? 'First page' : 'Meet hosts'}</Button>}
				/>
			) : (
				<div className="h-connection-list">
					{people.map(({ member, records, key }) => (
						<article key={key} className="h-connection-card">
							<Link className="h-connection-person" href={`/member?memberId=${member._id}`}>
								<SiteImage src={member.memberImage || '/img/profile/defaultUser.svg'} alt={member.memberNick} />
								<div>
									<h2>{member.memberNick}</h2>
									{member.memberDesc && <p className="h-clamped-bio">{member.memberDesc}</p>}
									<span className="h-text-link">View profile ↗</span>
								</div>
							</Link>
							<FollowButton memberId={member._id} following={isFollowing(records, user._id, member._id)} />
						</article>
					))}
				</div>
			)}
			{page && !loading && !error && (
				<Pagination
					page={page}
					limit={6}
					total={total}
					onChange={(next) => {
						void router.push(href(kind, String(next)), undefined, { scroll: false });
					}}
				/>
			)}
		</section>
	);
}
