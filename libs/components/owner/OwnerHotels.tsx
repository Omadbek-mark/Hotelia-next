import { useQuery, useReactiveVar } from '@apollo/client';
import { useReadyRouter as useRouter } from '../../hooks/useReadyRouter';
import { OWNER_HOTELS } from '../../../apollo/owner/owner';
import { userVar } from '../../../apollo/store';
import { label, ownerFilters } from '../../owner/model';
import { socialHref } from '../../social/query';
import { Hotels } from '../../types/contracts';
import { HotelSort, HotelStatus, MemberType } from '../../enums';
import { Button, CardSkeletons, Chip, EmptyState, Pagination, SiteImage } from '../common/ui';
import { InventoryAction, OwnerStatusFilter } from './InventoryControls';

export function OwnerHotels({ compact = false, choose = false }: { compact?: boolean; choose?: boolean }) {
	const router = useRouter(),
		user = useReactiveVar(userVar),
		filters = ownerFilters(compact ? {} : router.query, 'hotels'),
		input = {
			page: filters.page,
			limit: compact ? 3 : 6,
			sort: HotelSort.NEWEST,
			...(filters.status ? { hotelStatus: filters.status as HotelStatus } : {}),
		};
	const result = useQuery<{ getOwnerHotels: Hotels }>(OWNER_HOTELS, {
			variables: { input },
			skip: !router.isReady || !!filters.error || user.memberType !== MemberType.HOTEL_OWNER,
			fetchPolicy: 'network-only',
		}),
		list = result.data?.getOwnerHotels.list || [],
		total = result.data?.getOwnerHotels.metaCounter?.[0]?.total || 0;
	return (
		<section className="h-owner-section">
			<div className="h-owner-section-heading">
				<div>
					<span className="h-eyebrow">Registered hotels</span>
					<h2>{choose ? 'Choose a hotel' : 'My hotel listings'}</h2>
				</div>
				<Button href={compact ? '/owner?tab=hotels' : '/owner/hotel'}>
					{compact ? 'All hotels →' : 'Add hotel +'}
				</Button>
			</div>
			{!compact && <OwnerStatusFilter kind="hotels" />}
			{filters.error ? (
				<EmptyState title={filters.error} action={<Button href="/owner?tab=hotels">Reset filters</Button>} />
			) : result.loading ? (
				<CardSkeletons />
			) : result.error ? (
				<EmptyState
					error
					title="Hotels unavailable"
					action={<Button onClick={() => void result.refetch()}>Refresh hotels</Button>}
				/>
			) : !list.length ? (
				<EmptyState
					title="Your next sanctuary starts here"
					action={<Button href="/owner/hotel">Add your first hotel</Button>}
				/>
			) : (
				<div className="h-owner-hotels">
					{list.map((hotel) => (
						<article className="h-owner-hotel" key={hotel._id}>
							<SiteImage src={hotel.hotelImages[0]} alt={hotel.hotelName} />
							<div>
								<div className="h-owner-badges">
									<span className="h-eyebrow">{label(hotel.hotelType)}</span>
									<Chip tone={hotel.hotelStatus === 'ACTIVE' ? 'success' : 'warning'}>{label(hotel.hotelStatus)}</Chip>
								</div>
								<h3>{hotel.hotelName}</h3>
								<p>
									{hotel.hotelCity}, {hotel.hotelCountry}
								</p>
								<small>
									{hotel.hotelReviews} reviews · {hotel.hotelTimezone}
								</small>
								<div className="h-owner-actions">
									<Button variant="text" href={`/owner/hotel?hotelId=${hotel._id}`}>
										Edit hotel
									</Button>
									<Button variant="text" href={`/owner?tab=rooms&hotelId=${hotel._id}`}>
										Manage rooms
									</Button>
									<Button variant="text" href={`/owner?tab=bookings&hotelId=${hotel._id}`}>
										Reservations
									</Button>
									{!choose && <InventoryAction kind="hotel" item={hotel} />}
								</div>
							</div>
						</article>
					))}
				</div>
			)}
			{!compact && (
				<Pagination
					page={filters.page}
					total={total}
					limit={6}
					onChange={(p) =>
						void router.push(socialHref('/owner', { ...router.query, page: String(p) }), undefined, { scroll: false })
					}
				/>
			)}
		</section>
	);
}
