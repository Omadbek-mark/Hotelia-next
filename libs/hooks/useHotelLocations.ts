import { gql, useQuery } from '@apollo/client';
import { centralAsianCities } from '../search/destinations';

export interface HotelLocation { city: string; country: string }
export const GET_HOTEL_LOCATIONS = gql`
	query HotelLocations { getHotelLocations { city country } }
`;

export function useHotelLocations() {
	const result = useQuery<{ getHotelLocations: HotelLocation[] }>(GET_HOTEL_LOCATIONS, {
		fetchPolicy: 'cache-and-network',
	});
	const priorities = centralAsianCities.map(location => location.city);
	const locations = [...(result.data?.getHotelLocations || [])].sort((a, b) => {
		const left = priorities.indexOf(a.city), right = priorities.indexOf(b.city);
		return (left < 0 ? 100 : left) - (right < 0 ? 100 : right) || a.city.localeCompare(b.city);
	});
	return { locations, loading: result.loading, error: result.error, retry: result.refetch };
}
