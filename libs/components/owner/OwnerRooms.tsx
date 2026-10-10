import { useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { OWNER_HOTEL, OWNER_ROOMS } from '../../../apollo/owner/owner';
import { userVar } from '../../../apollo/store';
import { label, ownerFilters } from '../../owner/model';
import { isMemberId, socialHref } from '../../social/query';
import { Hotel, Rooms } from '../../types/contracts';
import { MemberType, RoomSort, RoomStatus } from '../../enums';
import { Button, CardSkeletons, Chip, EmptyState, formatUsd, Pagination, SiteImage } from '../common/ui';
import { InventoryAction, OwnerStatusFilter } from './InventoryControls';
import { OwnerHotels } from './OwnerHotels';

export function OwnerRooms() {
	const router = useRouter(),
		user = useReactiveVar(userVar),
		filters = ownerFilters(router.query, 'rooms'),
		valid = isMemberId(filters.hotelId) && !filters.error;
	const hotel = useQuery<{ getOwnerHotel: Hotel }>(OWNER_HOTEL, {
		variables: { hotelId: filters.hotelId },
		skip: !router.isReady || !valid || user.memberType !== MemberType.HOTEL_OWNER,
		fetchPolicy: 'network-only',
	});
	const result = useQuery<{ getOwnerRooms: Rooms }>(OWNER_ROOMS, {
		variables: {
			input: {
				hotelId: filters.hotelId,
				page: filters.page,
				limit: 6,
				sort: RoomSort.NEWEST,
				...(filters.status ? { roomStatus: filters.status as RoomStatus } : {}),
			},
		},
		skip:
			!router.isReady ||
			!valid ||
			!hotel.data?.getOwnerHotel ||
			!!hotel.error ||
			user.memberType !== MemberType.HOTEL_OWNER,
		fetchPolicy: 'network-only',
	});
	if (!filters.hotelId && !filters.error) return <OwnerHotels choose />;
	if (filters.error)
		return <EmptyState title={filters.error} action={<Button href="/owner?tab=rooms">Choose hotel</Button>} />;
	if (hotel.loading) return <EmptyState title="Opening inventory…" />;
	if (hotel.error || !hotel.data?.getOwnerHotel)
		return (
			<EmptyState
				error
				title="This inventory is unavailable"
				action={<Button href="/owner?tab=rooms">Choose another hotel</Button>}
			/>
		);
	const list = result.data?.getOwnerRooms.list || [],
		total = result.data?.getOwnerRooms.metaCounter?.[0]?.total || 0;
	return (
		<section className="h-owner-section">
			<Button variant="text" href="/owner?tab=hotels">
				← Hotels
			</Button>
			<div className="h-owner-section-heading">
				<div>
					<span className="h-eyebrow">{hotel.data.getOwnerHotel.hotelName}</span>
					<h1>Room inventory</h1>
					<p>Room types, units and nightly rates.</p>
				</div>
				<Button href={`/owner/room?hotelId=${filters.hotelId}`}>Add room +</Button>
			</div>
			<OwnerStatusFilter kind="rooms" />
			{result.loading ? (
				<CardSkeletons />
			) : result.error ? (
				<EmptyState
					error
					title="Rooms unavailable"
					action={<Button onClick={() => void result.refetch()}>Refresh rooms</Button>}
				/>
			) : !list.length ? (
				<EmptyState
					title="Make room for your first guests"
					action={<Button href={`/owner/room?hotelId=${filters.hotelId}`}>Add a room</Button>}
				/>
			) : (
				<div className="h-owner-room-grid">
					{list.map((room) => (
						<article className="h-owner-room" key={room._id}>
							<SiteImage src={room.roomImages[0]} alt={room.roomName} />
							<div className="h-owner-room-copy">
								<div className="h-owner-badges">
									<span className="h-eyebrow">
										{label(room.roomType)} · {label(room.bedType)}
									</span>
									<Chip tone={room.roomStatus === 'ACTIVE' ? 'success' : 'warning'}>{label(room.roomStatus)}</Chip>
								</div>
								<h2>{room.roomName}</h2>
								<p>
									{room.roomSize} m² · {room.roomCapacity} guests · {room.roomQuantity} units
								</p>
								<p className="h-owner-amenities">{room.roomAmenities.map(label).join(' · ')}</p>
								<strong className="h-owner-rate">
									{formatUsd(room.roomPrice)} <small>/ night</small>
								</strong>
								<div className="h-owner-actions">
									<Button variant="text" href={`/owner/room?hotelId=${filters.hotelId}&roomId=${room._id}`}>
										Edit room
									</Button>
									<InventoryAction kind="room" item={room} />
								</div>
							</div>
						</article>
					))}
				</div>
			)}
			<Pagination
				page={filters.page}
				total={total}
				limit={6}
				onChange={(p) =>
					void router.push(socialHref('/owner', { ...router.query, page: String(p) }), undefined, { scroll: false })
				}
			/>
		</section>
	);
}
