import { useQuery, useReactiveVar } from '@apollo/client';
import { MenuItem, Skeleton } from '@mui/material';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent } from 'react';
import { userVar } from '../../../apollo/store';
import { GET_DISCOVERY_HOTELS, HotelCollection } from '../../../apollo/user/discovery';
import { GET_HOST_DIRECTORY, PublicProfile } from '../../../apollo/user/social';
import { useViewerRefresh } from '../../hooks/useViewerRefresh';
import { hostSorts, isFollowing, parseHostQuery } from '../../social/query';
import { HotelSort } from '../../enums';
import FollowButton from '../common/FollowButton';
import { Button, EmptyState, Field, Pagination, SiteImage } from '../common/ui';

function HostFeature({ host, index }: { host: PublicProfile; index: number }) {
	const user = useReactiveVar(userVar);
	const { data, loading, error, refetch } = useQuery<{ getHotels: HotelCollection }>(GET_DISCOVERY_HOTELS, {
		variables: { input: { page: 1, limit: 1, sort: HotelSort.RATING, search: { ownerId: host._id } } },
		fetchPolicy: 'cache-and-network',
	});
	const hotel = data?.getHotels.list[0];
	return (
		<article className="h-host-feature">
			<div className="h-host-person">
				<span className="h-eyebrow">No. {String(index).padStart(2, '0')} · Hotel owner</span>
				<SiteImage
					className="h-host-portrait"
					src={host.memberImage || '/img/profile/defaultUser.svg'}
					alt={host.memberFullName || host.memberNick}
				/>
				<h2>
					<Link href={`/agent/detail?agentId=${host._id}`}>{host.memberFullName || host.memberNick}</Link>
				</h2>
				{host.memberDesc && <p className="h-clamped-bio">{host.memberDesc}</p>}
				<div className="h-host-counts">
					<span>{host.memberHotels} hotels</span>
					<span>{host.memberFollowers} followers</span>
				</div>
				<div className="h-social-actions">
					<Link className="h-text-link" href={`/agent/detail?agentId=${host._id}`}>
						Meet your host ↗
					</Link>
					<FollowButton memberId={host._id} following={isFollowing(host.meFollowed, user._id, host._id)} />
				</div>
			</div>
			<div className="h-host-sanctuary">
				{loading && !hotel ? (
					<Skeleton variant="rectangular" height={320} />
				) : error ? (
					<EmptyState
						error
						title="Stay could not load"
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
				) : hotel ? (
					<Link href={`/property/detail?id=${hotel._id}`}>
						<SiteImage src={hotel.hotelImages[0]} alt={hotel.hotelName} />
						<div>
							<span className="h-eyebrow">
								{hotel.hotelCity}, {hotel.hotelCountry}
							</span>
							<h3>{hotel.hotelName}</h3>
							<span>Explore this stay ↗</span>
						</div>
					</Link>
				) : (
					<EmptyState title="New stays on the horizon" />
				)}
			</div>
		</article>
	);
}

export default function Hosts() {
	const router = useRouter(),
		parsed = parseHostQuery(router.query),
		input = parsed.input;
	const { data, loading, error, refetch } = useQuery<{
		getHotelOwners: { list: PublicProfile[]; metaCounter?: { total: number }[] };
	}>(GET_HOST_DIRECTORY, {
		variables: { input },
		skip: !router.isReady || !!parsed.error,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	useViewerRefresh(refetch, router.isReady && !parsed.error);
	const navigate = (values: Record<string, string>) =>
		router.push(
			{
				pathname: '/agent',
				query: { text: input.search.text || '', sort: input.sort || 'memberRank', page: String(input.page), ...values },
			},
			undefined,
			{ scroll: false },
		);
	const search = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const text = String(new FormData(event.currentTarget).get('text') || '').trim();
		void navigate({ text, page: '1' });
	};
	const total = data?.getHotelOwners.metaCounter?.[0]?.total || 0;
	return (
		<div className="h-container h-social-page">
			<Head>
				<title>Meet our hosts · Hotelia</title>
			</Head>
			<div className="h-social-heading">
				<span className="h-eyebrow">The people behind the stay</span>
				<h1>Meet our hosts.</h1>
				<p>Independent hosts. Memorable places.</p>
			</div>
			<div className="h-host-toolbar">
				<form onSubmit={search} key={input.search.text || ''}>
					<Field
						name="text"
						label="Host nickname"
						defaultValue={input.search.text || ''}
						inputProps={{ maxLength: 100 }}
					/>
					<Button type="submit">Search</Button>
				</form>
				<Field
					select
					label="Sort hosts"
					value={input.sort}
					onChange={(event) => {
						void navigate({ sort: event.target.value, page: '1' });
					}}
				>
					{Object.entries(hostSorts).map(([value, label]) => (
						<MenuItem key={value} value={value}>
							{label}
						</MenuItem>
					))}
				</Field>
			</div>
			<p className="h-social-count" aria-live="polite">
				{loading ? 'Meeting your hosts…' : `${total} ${total === 1 ? 'host' : 'hosts'}`}
			</p>
			{parsed.error ? (
				<EmptyState error title="Check your host search" action={<Button href="/agent">Start fresh</Button>} />
			) : loading || !router.isReady ? (
				<Skeleton variant="rectangular" height={360} />
			) : error ? (
				<EmptyState
					error
					title="Hosts could not load"
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
			) : !data?.getHotelOwners.list.length ? (
				<EmptyState
					title="No hosts found"
					description="Try another nickname."
					action={<Button href="/agent">All hosts</Button>}
				/>
			) : (
				<div className="h-host-features">
					{data.getHotelOwners.list.map((host, index) => (
						<HostFeature key={host._id} host={host} index={(input.page - 1) * input.limit + index + 1} />
					))}
				</div>
			)}
			{!loading && !error && !parsed.error && (
				<Pagination
					page={input.page}
					limit={input.limit}
					total={total}
					onChange={(page) => {
						void navigate({ page: String(page) });
					}}
				/>
			)}
		</div>
	);
}
