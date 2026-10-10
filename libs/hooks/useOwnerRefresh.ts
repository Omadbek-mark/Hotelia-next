import { useApolloClient } from '@apollo/client';
export function useOwnerRefresh() {
	const client = useApolloClient();
	return async () => {
		client.cache.evict({ fieldName: 'getHotels' });
		client.cache.evict({ fieldName: 'getAvailableRooms' });
		client.cache.evict({ fieldName: 'getRooms' });
		await client.refetchQueries({
			include: 'active',
			onQueryUpdated: (q) =>
				[
					'HostDashboard',
					'HostHotels',
					'HostHotel',
					'HostRooms',
					'HostRoom',
					'HostReservations',
					'HostReservation',
				].includes(q.queryName || '')
					? q.refetch()
					: false,
		});
	};
}
