import { ApolloCache, gql } from '@apollo/client';
import type { FavoriteResult } from '../../libs/types/contracts';

const fields = gql`
	fragment CollectionHotel on Hotel {
		_id
		hotelName
		hotelCity
		hotelCountry
		hotelImages
		hotelAmenities
		hotelRating
		hotelReviews
		startingPrice
		isFavorite
	}
`;
export const GET_SAVED_STAYS = gql`
	query SavedStays($input: FavoritesInquiry!) {
		getFavorites(input: $input) {
			list {
				...CollectionHotel
			}
			metaCounter {
				total
			}
		}
	}
	${fields}
`;
export const GET_VIEWED_STAYS = gql`
	query ViewedStays($input: VisitedInquiry!) {
		getVisited(input: $input) {
			list {
				...CollectionHotel
			}
			metaCounter {
				total
			}
		}
	}
	${fields}
`;
export function syncFavoriteCache(cache: ApolloCache<unknown>, saved: FavoriteResult) {
	cache.modify({
		id: cache.identify({ __typename: 'Hotel', _id: saved.hotelId }),
		fields: { isFavorite: () => saved.isFavorite, hotelLikes: () => saved.hotelLikes },
	});
	// Membership and counts across every saved page must come from the server again.
	cache.evict({ id: 'ROOT_QUERY', fieldName: 'getFavorites' });
}
