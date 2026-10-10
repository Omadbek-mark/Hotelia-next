import { useQuery, useReactiveVar } from '@apollo/client';
import { Skeleton } from '@mui/material';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { userVar } from '../../../apollo/store';
import { GET_DISCOVERY_HOTELS, HotelCollection } from '../../../apollo/user/discovery';
import { GET_PROFILE_ARTICLES, GET_PUBLIC_PROFILE, PublicProfile } from '../../../apollo/user/social';
import { useViewerRefresh } from '../../hooks/useViewerRefresh';
import { isFollowing, isMemberId, socialHref, socialPage } from '../../social/query';
import { Direction, HotelSort, MemberStatus, MemberType } from '../../enums';
import FollowButton from '../common/FollowButton';
import HotelCard from '../common/HotelCard';
import { Button, CardSkeletons, Chip, EmptyState, Pagination, SiteImage } from '../common/ui';
import Connections from '../account/Connections';

function ProfileHotels({ memberId }: { memberId: string }) {
	const router = useRouter(),
		page = socialPage(router.query.hotelPage);
	const { data, loading, error, refetch } = useQuery<{ getHotels: HotelCollection }>(GET_DISCOVERY_HOTELS, {
		variables: { input: { page: page || 1, limit: 6, sort: HotelSort.RATING, search: { ownerId: memberId } } },
		skip: !page,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	return (
		<section id="host-hotels" className="h-profile-section">
			<div className="h-section-heading">
				<div>
					<span className="h-eyebrow">Places with a personal touch</span>
					<h2>Hosted stays.</h2>
				</div>
				<Link className="h-text-link" href={{ pathname: '/hotel', query: { ownerId: memberId } }}>
					All stays ↗
				</Link>
			</div>
			{!page ? (
				<EmptyState
					error
					title="Check your hotel page"
					action={<Button href={socialHref(router.pathname, { ...router.query, hotelPage: '1' })}>First page</Button>}
				/>
			) : loading ? (
				<CardSkeletons />
			) : error ? (
				<EmptyState
					error
					title="Hosted stays could not load"
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
			) : !data?.getHotels.list.length ? (
				<EmptyState
					title="New stays on the horizon"
					action={
						page > 1 ? (
							<Button href={socialHref(router.pathname, { ...router.query, hotelPage: '1' })}>First page</Button>
						) : undefined
					}
				/>
			) : (
				<div className="h-card-grid">
					{data.getHotels.list.map((hotel) => (
						<HotelCard key={hotel._id} hotel={hotel} />
					))}
				</div>
			)}
			{page && !loading && !error && (
				<Pagination
					page={page}
					limit={6}
					total={data?.getHotels.metaCounter[0]?.total || 0}
					onChange={(next) => {
						void router.push(
							{ pathname: router.pathname, query: { ...router.query, hotelPage: String(next) } },
							undefined,
							{ scroll: false },
						);
					}}
				/>
			)}
		</section>
	);
}

function ProfileJournal({ memberId }: { memberId: string }) {
	const router = useRouter(),
		page = socialPage(router.query.articlePage);
	const { data, loading, error, refetch } = useQuery<{
		getBoardArticles: {
			list: { _id: string; articleTitle: string; articleImage?: string; createdAt: string }[];
			metaCounter?: { total: number }[];
		};
	}>(GET_PROFILE_ARTICLES, {
		variables: {
			input: { page: page || 1, limit: 6, sort: 'createdAt', direction: Direction.DESC, search: { memberId } },
		},
		skip: !page,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	return (
		<section className="h-profile-section">
			<div className="h-section-heading">
				<div>
					<span className="h-eyebrow">From their travel journal</span>
					<h2>Stories & perspectives.</h2>
				</div>
			</div>
			{!page ? (
				<EmptyState
					error
					title="Check your article page"
					action={<Button href={socialHref('/member', { memberId, articlePage: '1' })}>First page</Button>}
				/>
			) : loading ? (
				<CardSkeletons />
			) : error ? (
				<EmptyState
					error
					title="Stories could not load"
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
			) : !data?.getBoardArticles.list.length ? (
				<EmptyState title="More stories to come" />
			) : (
				<div className="h-profile-journal-grid">
					{data.getBoardArticles.list.map((article) => (
						<Link
							key={article._id}
							className="h-profile-story"
							href={{ pathname: '/journal/detail', query: { articleId: article._id } }}
						>
							<SiteImage src={article.articleImage} alt={article.articleTitle} />
							<div>
								<span className="h-eyebrow">
									{new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
								</span>
								<h3>{article.articleTitle}</h3>
								<span className="h-text-link">Read story ↗</span>
							</div>
						</Link>
					))}
				</div>
			)}
			{page && !loading && !error && (
				<Pagination
					page={page}
					limit={6}
					total={data?.getBoardArticles.metaCounter?.[0]?.total || 0}
					onChange={(next) => {
						void router.push(
							{ pathname: '/member', query: { ...router.query, articlePage: String(next) } },
							undefined,
							{ scroll: false },
						);
					}}
				/>
			)}
		</section>
	);
}

export default function MemberProfile({ host = false }: { host?: boolean }) {
	const router = useRouter(),
		user = useReactiveVar(userVar),
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
	if (!router.isReady || loading)
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
			<section className={`h-profile-hero ${host ? 'h-profile-hero--host' : ''}`}>
				<div className="h-profile-portrait">
					<SiteImage src={member.memberImage || '/img/profile/defaultUser.svg'} alt={name} eager />
					<Chip>{member.memberType === MemberType.HOTEL_OWNER ? 'Hotel owner' : 'Hotelia member'}</Chip>
				</div>
				<div className="h-profile-intro">
					<span className="h-eyebrow">{host ? 'Meet your host' : 'The Hotelia community'}</span>
					<h1>{name}.</h1>
					<span className="h-profile-since">
						@{member.memberNick} · Member since {new Date(member.createdAt).getFullYear()}
					</span>
					{member.memberDesc && <p>{member.memberDesc}</p>}
					<div className="h-profile-stats">
						{member.memberType === MemberType.HOTEL_OWNER && (
							<div>
								<strong>{member.memberHotels}</strong>
								<span>Hotels</span>
							</div>
						)}
						<div>
							<strong>{member.memberArticles}</strong>
							<span>Stories</span>
						</div>
						<Link href={href('followers')}>
							<strong>{member.memberFollowers}</strong>
							<span>Followers</span>
						</Link>
						<Link href={href('followings')}>
							<strong>{member.memberFollowings}</strong>
							<span>Following</span>
						</Link>
					</div>
					<div className="h-social-actions">
						<FollowButton memberId={member._id} following={isFollowing(member.meFollowed, user._id, member._id)} />
						{member._id === user._id && (
							<Button href="/account?category=myProfile" variant="outlined">
								Edit profile
							</Button>
						)}
						{host && (
							<Button href="#host-hotels" variant="outlined">
								View hotels ↘
							</Button>
						)}
					</div>
				</div>
			</section>
			{!host && (
				<nav className="h-social-tabs" aria-label="Profile sections">
					{[
						...(member.memberType === MemberType.HOTEL_OWNER ? [['hotels', 'Hotels']] : []),
						['articles', 'Stories'],
						['followers', 'Followers'],
						['followings', 'Following'],
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
