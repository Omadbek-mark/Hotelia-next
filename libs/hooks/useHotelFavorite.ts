import { useApolloClient, useReactiveVar } from '@apollo/client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { userVar } from '../../apollo/store';
import { FAVORITE, UNFAVORITE } from '../../apollo/user/hotel-catalog';
import { syncFavoriteCache } from '../../apollo/user/collections';
import type { HotelCardData } from '../../apollo/user/discovery';

export function useHotelFavorite() {
	const client = useApolloClient(),
		user = useReactiveVar(userVar),
		router = useRouter();
	const inFlight = useRef(false);
	const [pending, setPending] = useState(false),
		[error, setError] = useState('');
	const toggle = async (hotel: HotelCardData) => {
		if (inFlight.current) return;
		inFlight.current = true;
		setPending(true);
		setError('');
		try {
			if (!user._id) {
				await router.push({ pathname: '/account/join', query: { referrer: router.asPath } });
				return;
			}
			const field = hotel.isFavorite ? 'unfavoriteHotel' : 'favoriteHotel';
			const result = await client.mutate({
				mutation: hotel.isFavorite ? UNFAVORITE : FAVORITE,
				variables: { hotelId: hotel._id },
			});
			if (!result.data?.[field]) throw Error('Missing favorite result');
			syncFavoriteCache(client.cache, result.data[field]);
		} catch {
			setError('Could not update your saved stays. Please try again.');
		} finally {
			inFlight.current = false;
			setPending(false);
		}
	};
	return { toggle, pending, error };
}
