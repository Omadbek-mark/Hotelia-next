import { useQuery } from '@apollo/client';
import { Skeleton } from '@mui/material';
import Head from 'next/head';
import Link from 'next/link';
import { useReadyRouter as useRouter } from '../../hooks/useReadyRouter';
import { GET_PUBLIC_PROFILE, PublicProfile } from '../../../apollo/user/social';
import { useViewerRefresh } from '../../hooks/useViewerRefresh';
import { isMemberId, socialHref } from '../../social/query';
import { MemberStatus, MemberType } from '../../enums';
import ProfileCard from '../common/ProfileCard';
import { ProfileHotels, ProfileJournal } from './ProfileContent';
import { Button, EmptyState } from '../common/ui';
import Connections from '../account/Connections';

export default function MemberProfile({ host = false }: { host?: boolean }) {
	const router = useRouter(),
		id = host ? router.query.ownerId : router.query.memberId;
	const valid = isMemberId(id);
	const { data, loading, error, refetch } = useQuery<{ getMember: PublicProfile }>(GET_PUBLIC_PROFILE, {
		variables: { memberId: valid ? id : '' },
		skip: !router.isReady || !valid,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	useViewerRefresh(refetch, router.isReady && valid);
	const member = data?.getMember,
		unavailable =
			!member || member.memberStatus !== MemberStatus.ACTIVE || (host && member.memberType !== MemberType.HOTEL_OWNER);
	if (!router.isReady || (loading && !member))
		return (
			<div className="h-container h-social-page">
				<Skeleton variant="rectangular" height={460} />
			</div>
		);
	if (!valid || error || unavailable)
		return (
			<div className="h-container h-social-page">
				<EmptyState
					error
					title={host ? 'Host unavailable' : 'Profile unavailable'}
					action={
						error && valid ? (
							<Button
								onClick={() => {
									void refetch().catch(() => {});
								}}
							>
								Try again
							</Button>
						) : (
							<Button href="/hotel-owner">Meet hosts</Button>
						)
					}
				/>
			</div>
		);
	const name = member.memberFullName || member.memberNick;
	const category = host
		? 'hotels'
		: router.query.category || (member.memberType === MemberType.HOTEL_OWNER ? 'hotels' : 'articles');
	const href = (tab: string) => socialHref('/member', { memberId: member._id, category: tab });
	return (
		<div className="h-container h-social-page h-public-profile">
			<Head>
				<title>{name} · Hotelia</title>
			</Head>
			<Link className="h-text-link h-profile-back" href="/hotel-owner">
				← Meet our hosts
			</Link>
			<div className="h-member-card-intro">
				<ProfileCard member={member} heading />
				<div>
					<span className="h-eyebrow">{host ? 'The people behind the places' : 'The Hotelia community'}</span>
					<h2>{host ? 'Warm welcomes.\nMemorable stays.' : 'Every journey\nbrings us closer.'}</h2>
					<p>
						Member since {new Date(member.createdAt).getFullYear()} · {member.memberArticles}{' '}
						{member.memberArticles === 1 ? 'story' : 'stories'} shared
					</p>
					{host && (
						<Button variant="outlined" href="#host-hotels">
							View hotels ↘
						</Button>
					)}
				</div>
			</div>
			{!host && (
				<nav className="h-social-tabs" aria-label="Profile sections">
					{[
						...(member.memberType === MemberType.HOTEL_OWNER ? [['hotels', 'Hotels']] : []),
						['articles', 'Stories'],
					].map(([tab, label]) => (
						<Link key={tab} href={href(tab)} aria-current={category === tab ? 'page' : undefined}>
							{label}
						</Link>
					))}
				</nav>
			)}
			{category === 'hotels' ? (
				member.memberType === MemberType.HOTEL_OWNER ? (
					<ProfileHotels memberId={member._id} />
				) : (
					<EmptyState title="This member does not host stays" />
				)
			) : category === 'followers' || category === 'followings' ? (
				<Connections key={`${member._id}:${category}`} memberId={member._id} kind={category} />
			) : category === 'articles' ? (
				<ProfileJournal memberId={member._id} />
			) : (
				<EmptyState title="Choose a profile section" action={<Button href={href('articles')}>Stories</Button>} />
			)}
		</div>
	);
}
