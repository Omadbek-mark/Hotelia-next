import { userVar } from '../../../apollo/store';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Skeleton } from '@mui/material';
import { GET_HOST_DIRECTORY, PublicProfile } from '../../../apollo/user/social';
import Link from 'next/link';
import { useHoteliaTranslation } from '../../hooks/useHoteliaTranslation';
import { useViewerRefresh } from '../../hooks/useViewerRefresh';
import { HotelOwnersInquiry, TotalCounter } from '../../types/contracts';
import { Direction } from '../../enums';
import { Button, EmptyState, SectionHeading, SiteImage } from '../common/ui';

export default function Hosts() {
	const tr = useHoteliaTranslation();
	const user = useReactiveVar(userVar);
	const { data, loading, error, refetch } = useQuery<
		{ getHotelOwners: { list: PublicProfile[]; metaCounter: TotalCounter[] } },
		{ input: HotelOwnersInquiry }
	>(GET_HOST_DIRECTORY, {
		variables: { input: { page: 1, limit: 4, sort: 'memberRank', direction: Direction.DESC, search: {} } },
		notifyOnNetworkStatusChange: true,
	});
	useViewerRefresh(refetch, true);
	return (
		<section className="h-section h-container">
			<SectionHeading
				eyebrow={tr('People behind the places')}
				title={tr('Meet your hosts')}
				href="/hotel-owner"
				action={tr('All hosts')}
			/>
			{loading && !data ? (
				<div className="h-featured-host-grid">
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
				<div className="h-featured-host-grid">
					{data.getHotelOwners.list.map((host) =>
						host._id === user._id ? (
							<div className="h-featured-host" key={host._id}>
								<SiteImage src={host.memberImage || '/img/profile/defaultUser.svg'} alt={host.memberNick} />
								<h3>
									<Link href="/account?category=myProfile">{host.memberFullName || host.memberNick}</Link>
								</h3>
								<span>{tr('Hotel owner')} · You</span>
							</div>
						) : (
							<Link
								className="h-featured-host"
								key={host._id}
								href={{ pathname: '/hotel-owner/detail', query: { ownerId: host._id } }}
							>
								<SiteImage src={host.memberImage || '/img/profile/defaultUser.svg'} alt={host.memberNick} />
								<h3>{host.memberFullName || host.memberNick}</h3>
								<span>{tr('Hotel owner')}</span>
							</Link>
						),
					)}
				</div>
			) : (
				<EmptyState title="More hosts coming soon" />
			)}
		</section>
	);
}
