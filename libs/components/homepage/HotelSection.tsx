import { useQuery } from '@apollo/client';
import { GET_DISCOVERY_HOTELS, HotelCollection } from '../../../apollo/user/discovery';
import { HotelsInquiry } from '../../types/contracts';
import { HotelSort } from '../../enums';
import { useViewerRefresh } from '../../hooks/useViewerRefresh';
import HotelCard from '../common/HotelCard';
import { Button, CardSkeletons, EmptyState, SectionHeading } from '../common/ui';

export default function HotelSection({ title, eyebrow, sort }: { title: string; eyebrow: string; sort: HotelSort }) {
	const { data, loading, error, refetch } = useQuery<{ getHotels: HotelCollection }, { input: HotelsInquiry }>(
		GET_DISCOVERY_HOTELS,
		{
			variables: { input: { page: 1, limit: 3, sort } },
			notifyOnNetworkStatusChange: true,
		},
	);
	useViewerRefresh(refetch, true);
	return (
		<section className="h-section h-container">
			<SectionHeading eyebrow={eyebrow} title={title} href={`/hotel?sort=${sort}`} action="All stays" />
			{loading ? (
				<CardSkeletons />
			) : error ? (
				<EmptyState
					title="Stays are taking a moment"
					description="Please try again."
					error
					action={
						<Button
							variant="outlined"
							onClick={() => {
								void refetch();
							}}
						>
							Retry
						</Button>
					}
				/>
			) : data?.getHotels.list.length ? (
				<div className="h-card-grid">
					{data.getHotels.list.map((hotel) => (
						<HotelCard key={hotel._id} hotel={hotel} />
					))}
				</div>
			) : (
				<EmptyState title="New stays are on their way" />
			)}
		</section>
	);
}
