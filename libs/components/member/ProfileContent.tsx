import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { useReadyRouter as useRouter } from '../../hooks/useReadyRouter';
import { GET_DISCOVERY_HOTELS, HotelCollection } from '../../../apollo/user/discovery';
import { GET_PROFILE_ARTICLES } from '../../../apollo/user/social';
import { socialHref, socialPage } from '../../social/query';
import { Direction, HotelSort } from '../../enums';
import HotelCard from '../common/HotelCard';
import { Button, CardSkeletons, EmptyState, Pagination, SiteImage } from '../common/ui';

export function ProfileHotels({ memberId, own = false }: { memberId: string; own?: boolean }) {
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
					<span className="h-eyebrow">{own ? 'Your published stays' : 'Places with a personal touch'}</span>
					<h2>{own ? 'Your hotels.' : 'Hosted stays.'}</h2>
				</div>
				{!own && (
					<Link className="h-text-link" href={{ pathname: '/hotel', query: { ownerId: memberId } }}>
						All stays ↗
					</Link>
				)}
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

export function ProfileJournal({ memberId, own = false }: { memberId: string; own?: boolean }) {
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
					<span className="h-eyebrow">{own ? 'From your travel journal' : 'From their travel journal'}</span>
					<h2>Stories & perspectives.</h2>
				</div>
			</div>
			{!page ? (
				<EmptyState
					error
					title="Check your article page"
					action={<Button href={socialHref(router.pathname, { ...router.query, articlePage: '1' })}>First page</Button>}
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
							{ pathname: router.pathname, query: { ...router.query, articlePage: String(next) } },
							undefined,
							{ scroll: false },
						);
					}}
				/>
			)}
		</section>
	);
}
