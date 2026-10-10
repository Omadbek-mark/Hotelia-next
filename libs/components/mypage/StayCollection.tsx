import { useApolloClient, useQuery, useReactiveVar } from '@apollo/client';
import { Alert } from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { GET_SAVED_STAYS, GET_VIEWED_STAYS, syncFavoriteCache } from '../../../apollo/user/collections';
import type { HotelCardData, HotelCollection } from '../../../apollo/user/discovery';
import { SAVE_DETAIL_HOTEL, UNSAVE_DETAIL_HOTEL } from '../../../apollo/user/hotel-detail';
import type { FavoriteResult } from '../../types/contracts';
import HotelCard from '../common/HotelCard';
import { Button, CardSkeletons, EmptyState, Pagination } from '../common/ui';

export default function StayCollection({ kind }: { kind: 'saved' | 'viewed' }) {
	const router = useRouter(),
		user = useReactiveVar(userVar),
		client = useApolloClient();
	const savedPage = kind === 'saved',
		title = savedPage ? 'Saved stays' : 'Recently viewed';
	const category = savedPage ? 'myFavorites' : 'recentlyVisited';
	const raw = router.query.collectionPage;
	const page = raw === undefined ? 1 : typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : NaN;
	const validPage = Number.isInteger(page) && page >= 1 && page <= 1000000;
	const { data, loading, error, refetch } = useQuery<{ getFavorites?: HotelCollection; getVisited?: HotelCollection }>(
		savedPage ? GET_SAVED_STAYS : GET_VIEWED_STAYS,
		{
			variables: { input: { page: validPage ? page : 1, limit: 6 } },
			skip: !router.isReady || !user._id || !validPage,
			fetchPolicy: 'network-only',
			notifyOnNetworkStatusChange: true,
		},
	);
	const collection = savedPage ? data?.getFavorites : data?.getVisited;
	const total = collection?.metaCounter[0]?.total || 0;
	const inFlight = useRef(new Set<string>());
	const [saving, setSaving] = useState<string[]>([]),
		[message, setMessage] = useState('');
	const navigate = (next: number) =>
		router.push({ pathname: '/mypage', query: { category, collectionPage: String(next) } }, undefined, {
			scroll: false,
		});
	const refresh = () => {
		setMessage('');
		void refetch().catch(() => setMessage('Stays could not refresh. Try again.'));
	};
	const favorite = async (hotel: HotelCardData) => {
		if (!user._id || inFlight.current.has(hotel._id)) return;
		inFlight.current.add(hotel._id);
		setSaving(Array.from(inFlight.current));
		setMessage('');
		try {
			const result = await client.mutate<{ favoriteHotel?: FavoriteResult; unfavoriteHotel?: FavoriteResult }>({
				mutation: hotel.isFavorite ? UNSAVE_DETAIL_HOTEL : SAVE_DETAIL_HOTEL,
				variables: { hotelId: hotel._id },
			});
			const saved = result.data?.[hotel.isFavorite ? 'unfavoriteHotel' : 'favoriteHotel'];
			if (!saved) throw Error('No save response');
			syncFavoriteCache(client.cache, saved);
			if (savedPage) {
				try {
					if (page > 1 && collection?.list.length === 1 && !saved.isFavorite) await navigate(page - 1);
					else await refetch();
				} catch {
					setMessage('Saved stays updated. Refresh to see your latest list.');
				}
			}
		} catch {
			setMessage('Could not update saved stays. Try again.');
		} finally {
			inFlight.current.delete(hotel._id);
			setSaving(Array.from(inFlight.current));
		}
	};
	return (
		<>
			<Head>
				<title>{title} · Hotelia</title>
			</Head>
			<div className="h-collection-heading">
				<div>
					<span className="h-eyebrow">{savedPage ? 'Your next escape' : 'Pick up where you left off'}</span>
					<h1>{title}.</h1>
					<p>{savedPage ? 'Keep the places that stay with you.' : 'Stays you’ve explored, latest first.'}</p>
				</div>
				<Button variant="outlined" href="/property">
					Explore stays ↗
				</Button>
			</div>
			<div className="h-collection-toolbar">
				<p aria-live="polite">{loading ? 'Opening your stays…' : `${total} ${total === 1 ? 'stay' : 'stays'}`}</p>
				<Button variant="text" disabled={loading || !validPage} onClick={refresh}>
					Refresh
				</Button>
			</div>
			{message && (
				<Alert severity="warning" onClose={() => setMessage('')}>
					{message}
				</Alert>
			)}
			{!validPage ? (
				<EmptyState
					error
					title="Check your page"
					action={
						<Button
							onClick={() => {
								void navigate(1);
							}}
						>
							First page
						</Button>
					}
				/>
			) : loading || !router.isReady ? (
				<CardSkeletons count={6} />
			) : error ? (
				<EmptyState error title="Stays could not load" action={<Button onClick={refresh}>Try again</Button>} />
			) : !collection?.list.length ? (
				<EmptyState
					title={
						page > 1 ? 'No stays on this page' : savedPage ? 'A little inspiration awaits' : 'Your journey starts here'
					}
					description={
						page > 1
							? undefined
							: savedPage
							? 'Tap the heart on a stay you love.'
							: 'Open a hotel to find it here later.'
					}
					action={
						page > 1 ? (
							<Button
								onClick={() => {
									void navigate(1);
								}}
							>
								First page
							</Button>
						) : (
							<Button href="/property" color="secondary">
								Find a stay
							</Button>
						)
					}
				/>
			) : (
				<div className="h-card-grid h-collection-grid">
					{collection.list.map((hotel) => (
						<HotelCard key={hotel._id} hotel={hotel} onFavorite={favorite} saving={saving.includes(hotel._id)} />
					))}
				</div>
			)}
			{validPage && !loading && !error && (
				<Pagination
					page={page}
					limit={6}
					total={total}
					onChange={(next) => {
						void navigate(next).catch(() => setMessage('Could not open this page. Try again.'));
					}}
				/>
			)}
		</>
	);
}
