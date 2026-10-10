import { FAVORITE, UNFAVORITE } from '../../../apollo/user/hotel-catalog';
import { useApolloClient, useQuery, useReactiveVar } from '@apollo/client';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import { Alert, Drawer, MenuItem } from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { syncFavoriteCache } from '../../../apollo/user/collections';
import { GET_DISCOVERY_HOTELS, HotelCardData, HotelCollection } from '../../../apollo/user/discovery';
import { hotelSearchQuery, parseHotelSearch, searchLabels, sortLabels } from '../../search/hotel-search';
import type { HotelSearch, HotelsInquiry } from '../../types/contracts';
import { HotelSort } from '../../enums';
import HotelCard from '../common/HotelCard';
import { Button, CardSkeletons, EmptyState, Field, Pagination } from '../common/ui';
import PublicLayout from '../layout/PublicLayout';
import Filters from './CatalogFilters';
import SearchBar from './SearchBar';

export default function HotelCatalog() {
	const router = useRouter(),
		client = useApolloClient(),
		user = useReactiveVar(userVar);
	const parsed = useMemo(() => parseHotelSearch(router.query), [router.query]);
	const input = parsed.input;
	const [drawer, setDrawer] = useState(false),
		[message, setMessage] = useState('');
	const [saving, setSaving] = useState<string[]>([]);
	const inFlight = useRef(new Set<string>());
	const { data, loading, error, refetch } = useQuery<{ getHotels: HotelCollection }>(GET_DISCOVERY_HOTELS, {
		variables: { input },
		skip: !router.isReady || !!parsed.error,
		notifyOnNetworkStatusChange: true,
		fetchPolicy: 'cache-and-network',
	});
	const previousUser = useRef(user._id);
	useEffect(() => {
		if (previousUser.current !== user._id) {
			previousUser.current = user._id;
			if (router.isReady && !parsed.error) refetch().catch(() => {});
		}
	}, [user._id, router.isReady, parsed.error, refetch]);
	const total = data?.getHotels.metaCounter[0]?.total || 0;
	const apply = (next: HotelsInquiry) =>
		router.push({ pathname: '/hotel', query: hotelSearchQuery(next) }, undefined, { scroll: false });
	const changeSearch = (search: HotelSearch) => {
		const next = { ...input.search };
		['destination', 'checkIn', 'checkOut', 'guests', 'rooms'].forEach((key) => delete next[key as keyof HotelSearch]);
		return apply({ ...input, page: 1, search: { ...next, ...search } });
	};
	const favorite = async (hotel: HotelCardData) => {
		if (!user._id) {
			await router.push({ pathname: '/account/join', query: { referrer: router.asPath } });
			return;
		}
		if (inFlight.current.has(hotel._id)) return;
		inFlight.current.add(hotel._id);
		setSaving(Array.from(inFlight.current));
		setMessage('');
		try {
			const result = await client.mutate({
				mutation: hotel.isFavorite ? UNFAVORITE : FAVORITE,
				variables: { hotelId: hotel._id },
			});
			const saved = result.data?.[hotel.isFavorite ? 'unfavoriteHotel' : 'favoriteHotel'];
			if (!saved) throw Error('Missing favorite result');
			syncFavoriteCache(client.cache, saved);
		} catch {
			setMessage('Could not update your saved stays. Please try again.');
		} finally {
			inFlight.current.delete(hotel._id);
			setSaving(Array.from(inFlight.current));
		}
	};
	const query = hotelSearchQuery(input);
	const stayQuery: Record<string, string> = {};
	['checkIn', 'checkOut', 'guests', 'rooms', 'roomType'].forEach((key) => {
		if (query[key]) stayQuery[key] = query[key];
	});
	const chips = Object.entries(query).filter(([key]) => !['page', 'limit', 'sort'].includes(key));
	const remove = (key: string) => {
		const next = { ...query };
		delete next[key];
		if (key === 'checkIn' || key === 'checkOut') {
			delete next.checkIn;
			delete next.checkOut;
		}
		apply({ ...parseHotelSearch(next).input, page: 1 }).catch(() => setMessage('Could not update search.'));
	};
	const navigate = (next: HotelsInquiry) => {
		apply(next).catch(() => setMessage('Could not update search.'));
	};
	return (
		<PublicLayout>
			<Head>
				<title>Stays · Hotelia</title>
				<meta name="description" content="Find your next stay with Hotelia." />
			</Head>
			<section className="h-catalog-intro">
				<div className="h-container">
					<span className="h-eyebrow">A place for every journey</span>
					<h1>
						Available <em>stays.</em>
					</h1>
					<SearchBar initialSearch={input.search} onSearch={changeSearch} />
				</div>
			</section>
			<section className="h-container h-catalog-body">
				<aside className="h-catalog-sidebar">
					<Filters input={input} apply={apply} />
				</aside>
				<div className="h-catalog-results">
					<div className="h-catalog-toolbar">
						<div>
							<span className="h-eyebrow">Find your kind of escape</span>
							<p aria-live="polite">
								{loading || !router.isReady ? 'Finding stays…' : `${total} ${total === 1 ? 'stay' : 'stays'}`}
							</p>
						</div>
						<Button
							className="h-mobile-filters"
							variant="outlined"
							startIcon={<TuneIcon />}
							onClick={() => setDrawer(true)}
						>
							Filters
						</Button>
						<Field
							select
							label="Sort by"
							value={input.sort}
							onChange={(event) => navigate({ ...input, page: 1, sort: event.target.value as HotelSort })}
						>
							{Object.values(HotelSort).map((sort) => (
								<MenuItem key={sort} value={sort}>
									{sortLabels[sort]}
								</MenuItem>
							))}
						</Field>
					</div>
					{!!chips.length && (
						<div className="h-active-filters">
							{chips.map(([key, value]) => (
								<button key={key} onClick={() => remove(key)} aria-label={`Remove ${key} filter`}>
									{searchLabels[value] ||
										(key === 'amenities'
											? value
													.split(',')
													.map((item) => searchLabels[item])
													.join(', ')
											: `${
													(
														{
															minPrice: 'From $',
															maxPrice: 'Up to $',
															minRating: 'Rating ',
															guests: 'Guests: ',
															rooms: 'Rooms: ',
															ownerId: 'Host: ',
														} as Record<string, string>
													)[key] || ''
											  }${value}`)}
									<CloseIcon fontSize="small" />
								</button>
							))}
							<button
								className="h-clear-filters"
								onClick={() => navigate({ page: 1, limit: input.limit, sort: input.sort })}
							>
								Clear all
							</button>
						</div>
					)}
					{message && (
						<Alert severity="error" onClose={() => setMessage('')}>
							{message}
						</Alert>
					)}
					{parsed.error ? (
						<EmptyState
							error
							title="Check your search"
							description={parsed.error}
							action={
								<Button onClick={() => navigate({ page: 1, limit: 9, sort: HotelSort.NEWEST })}>Start fresh</Button>
							}
						/>
					) : loading || !router.isReady ? (
						<CardSkeletons count={6} />
					) : error ? (
						<EmptyState
							error
							title="Stays could not load"
							description="Please try again."
							action={
								<Button
									onClick={() => {
										refetch().catch(() => {});
									}}
								>
									Try again
								</Button>
							}
						/>
					) : !data?.getHotels.list.length ? (
						<EmptyState
							title="A different escape awaits"
							description="Try fewer filters or another destination."
							action={
								<Button variant="outlined" onClick={() => navigate({ ...input, page: 1, search: {} })}>
									Explore all stays
								</Button>
							}
						/>
					) : (
						<div className="h-card-grid">
							{data.getHotels.list.map((hotel) => (
								<HotelCard
									key={hotel._id}
									hotel={hotel}
									stayQuery={stayQuery}
									onFavorite={favorite}
									saving={saving.includes(hotel._id)}
								/>
							))}
						</div>
					)}
					{!parsed.error && !error && !loading && (
						<Pagination
							page={input.page || 1}
							limit={input.limit || 9}
							total={total}
							onChange={(page) => navigate({ ...input, page })}
						/>
					)}
					{!loading &&
						!error &&
						!parsed.error &&
						total > 0 &&
						(input.page || 1) > Math.ceil(total / (input.limit || 9)) && (
							<Button onClick={() => navigate({ ...input, page: 1 })}>Back to first page</Button>
						)}
				</div>
			</section>
			<Drawer
				anchor="right"
				open={drawer}
				onClose={() => setDrawer(false)}
				PaperProps={{ className: 'h-filter-drawer' }}
			>
				<Filters input={input} apply={apply} close={() => setDrawer(false)} />
			</Drawer>
		</PublicLayout>
	);
}
