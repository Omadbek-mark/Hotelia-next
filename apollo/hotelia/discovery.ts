import { gql } from '@apollo/client';
import type { Hotel, Member, TotalCounter } from '../../libs/types/hotelia/contracts';

export type HotelCardData = Pick<Hotel, '_id' | 'hotelName' | 'hotelCity' | 'hotelCountry' | 'hotelImages' | 'hotelAmenities' | 'hotelRating' | 'hotelReviews' | 'startingPrice' | 'isFavorite'>;
export interface HotelCollection { list: HotelCardData[]; metaCounter: TotalCounter[]; }
export type HostCardData = Pick<Member, '_id' | 'memberNick' | 'memberFullName' | 'memberImage' | 'memberDesc' | 'memberHotels'>;

export const GET_DISCOVERY_HOTELS = gql`
	query DiscoveryHotels($input: HotelsInquiry!) {
		getHotels(input: $input) {
			list { _id hotelName hotelCity hotelCountry hotelImages hotelAmenities hotelRating hotelReviews startingPrice isFavorite }
			metaCounter { total }
		}
	}
`;

export const GET_DISCOVERY_HOSTS = gql`
	query DiscoveryHosts($input: HotelOwnersInquiry!) {
		getHotelOwners(input: $input) {
			list { _id memberNick memberFullName memberImage memberDesc memberHotels }
			metaCounter { total }
		}
	}
`;
