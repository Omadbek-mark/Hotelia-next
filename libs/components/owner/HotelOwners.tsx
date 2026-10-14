import { useQuery } from '@apollo/client';
import { MenuItem, Skeleton } from '@mui/material';
import Head from 'next/head';
import ProfileCard from '../common/ProfileCard';
import { useReadyRouter as useRouter } from '../../hooks/useReadyRouter';
import { FormEvent } from 'react';
import { GET_HOST_DIRECTORY, PublicProfile } from '../../../apollo/user/social';
import { useViewerRefresh } from '../../hooks/useViewerRefresh';
import { hostSorts, isFollowing, parseHostQuery } from '../../social/query';
import { Button, EmptyState, Field, Pagination } from '../common/ui';

export default function HotelOwners() {
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
				pathname: '/hotel-owner',
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
				<EmptyState error title="Check your host search" action={<Button href="/hotel-owner">Start fresh</Button>} />
			) : (loading && !data) || !router.isReady ? (
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
					action={<Button href="/hotel-owner">All hosts</Button>}
				/>
			) : (
				<div className="h-person-grid h-host-directory-grid">
					{data.getHotelOwners.list.map((host) => (
						<ProfileCard key={host._id} member={host} />
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
