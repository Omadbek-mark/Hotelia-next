import { gql } from '@apollo/client';

export const FAVORITE = gql`
	mutation SaveCatalogHotel($hotelId: String!) {
		favoriteHotel(hotelId: $hotelId) {
			hotelId
			isFavorite
			hotelLikes
		}
	}
`;

export const UNFAVORITE = gql`
	mutation UnsaveCatalogHotel($hotelId: String!) {
		unfavoriteHotel(hotelId: $hotelId) {
			hotelId
			isFavorite
			hotelLikes
		}
	}
`;
