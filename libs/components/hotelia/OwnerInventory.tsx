import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useApolloClient, useReactiveVar } from '@apollo/client';
import {
	OWNER_HOTELS,
	OWNER_HOTEL,
	OWNER_ROOMS,
	UPDATE_HOTEL,
	UPDATE_ROOM,
	DELETE_HOTEL,
	DELETE_ROOM,
} from '../../../apollo/hotelia/owner';
import { userVar } from '../../../apollo/store';
import { Hotels, Hotel, Rooms, Room } from '../../types/hotelia/contracts';
import { HotelSort, RoomSort, HotelStatus, RoomStatus, MemberType } from '../../types/hotelia/enums';
import { socialHref, isMemberId } from '../../social/query';
import { ownerFilters, label, ownerError } from '../../owner/model';
import { Button, SiteImage, Chip, EmptyState, CardSkeletons, Pagination, Modal, formatUsd } from './ui';
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
export function OwnerStatusFilter({ kind }: { kind: 'hotels' | 'rooms' }) {
	const router = useRouter();
	return (
		<nav className="h-owner-tabs" aria-label="Inventory status">
			{[
				['', 'All'],
				['ACTIVE', 'Active'],
				['PAUSED', 'Paused'],
			].map(([value, text]) => (
				<Button
					key={text}
					variant={(router.query.status || '') === value ? 'contained' : 'text'}
					onClick={() =>
						void router.push(
							socialHref('/owner', { ...router.query, tab: kind, status: value || undefined, page: undefined }),
							undefined,
							{ scroll: false },
						)
					}
				>
					{text}
				</Button>
			))}
		</nav>
	);
}
function InventoryAction({ item, kind }: { item: Hotel | Room; kind: 'hotel' | 'room' }) {
	const user = useReactiveVar(userVar),
		refresh = useOwnerRefresh(),
		[mutation] = useMutation(kind === 'hotel' ? UPDATE_HOTEL : UPDATE_ROOM),
		[remove] = useMutation(kind === 'hotel' ? DELETE_HOTEL : DELETE_ROOM),
		[busy, setBusy] = useState(false),
		[error, setError] = useState(''),
		[confirm, setConfirm] = useState(false),
		lock = useRef(false);
	const status = kind === 'hotel' ? (item as Hotel).hotelStatus : (item as Room).roomStatus;
	const apply = async (deleting: boolean) => {
		if (lock.current || user.memberType !== MemberType.HOTEL_OWNER) return;
		lock.current = true;
		setBusy(true);
		setError('');
		try {
			await (deleting
				? remove({ variables: { [kind === 'hotel' ? 'hotelId' : 'roomId']: item._id } })
				: mutation({
						variables: {
							input: {
								_id: item._id,
								[kind === 'hotel' ? 'hotelStatus' : 'roomStatus']: status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
							},
						},
				  }));
			setConfirm(false);
		} catch (e) {
			setError(ownerError(e));
		} finally {
			try {
				await refresh();
			} catch {
				setError('Refresh your workspace to see the latest changes.');
			}
			lock.current = false;
			setBusy(false);
		}
	};
	return (
		<>
			<Button variant="outlined" disabled={busy} onClick={() => void apply(false)}>
				{status === 'ACTIVE' ? 'Pause listing' : 'Activate listing'}
			</Button>
			<Button
				variant="text"
				disabled={busy}
				onClick={() => {
					setError('');
					setConfirm(true);
				}}
			>
				Remove {kind}
			</Button>
			{error && (
				<p className="h-owner-error" role="alert">
					{error}
				</p>
			)}
			<Modal
				title={`Remove this ${kind}?`}
				open={confirm}
				onClose={() => {
					if (!busy) setConfirm(false);
				}}
			>
				<p>This listing will be withdrawn. Existing reservations may prevent removal.</p>
				{error && <p role="alert">{error}</p>}
				<div className="h-journal-actions">
					<Button variant="text" disabled={busy} onClick={() => setConfirm(false)}>
						Keep listing
					</Button>
					<Button disabled={busy} onClick={() => void apply(true)}>
						{busy ? 'Removing…' : 'Remove listing'}
					</Button>
				</div>
			</Modal>
		</>
	);
}
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
					<span className="h-eyebrow">Registered properties</span>
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
