import { useQuery } from '@apollo/client';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Skeleton } from '@mui/material';
import Link from 'next/link';
import { GET_DISCOVERY_HOSTS, HostCardData } from '../../../apollo/user/discovery';
import { HotelOwnersInquiry, TotalCounter } from '../../types/contracts';
import { Direction } from '../../enums';
import { Button, EmptyState, SectionHeading, SiteImage } from '../common/ui';

export default function Hosts() {
	const { data, loading, error, refetch } = useQuery<
		{ getHotelOwners: { list: HostCardData[]; metaCounter: TotalCounter[] } },
		{ input: HotelOwnersInquiry }
	>(GET_DISCOVERY_HOSTS, {
		variables: { input: { page: 1, limit: 4, sort: 'memberRank', direction: Direction.DESC, search: {} } },
		notifyOnNetworkStatusChange: true,
	});
	return (
		<section className="h-section h-container">
			<SectionHeading eyebrow="People behind the places" title="Meet your hosts" href="/agent" action="All hosts" />
			{loading ? (
				<div className="h-host-grid">
					{Array.from({ length: 4 }, (_, i) => (
						<Skeleton key={i} variant="rectangular" height={160} />
					))}
				</div>
			) : error ? (
				<EmptyState
					title="Hosts are taking a moment"
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
			) : data?.getHotelOwners.list.length ? (
				<div className="h-host-grid">
					{data.getHotelOwners.list.map((host) => (
						<Link className="h-host-card" href={`/agent/detail?agentId=${host._id}`} key={host._id}>
							<SiteImage
								src={host.memberImage || '/img/profile/defaultUser.svg'}
								alt={host.memberFullName || host.memberNick}
							/>
							<h3>{host.memberFullName || host.memberNick}</h3>
							<span>
								{host.memberHotels} {host.memberHotels === 1 ? 'hotel' : 'hotels'}
							</span>
							<ArrowForwardIcon fontSize="small" />
						</Link>
					))}
				</div>
			) : (
				<EmptyState title="More hosts coming soon" />
			)}
		</section>
	);
}
