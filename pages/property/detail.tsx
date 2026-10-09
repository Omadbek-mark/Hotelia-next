import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApolloClient, useQuery, useReactiveVar } from '@apollo/client';
import { Alert, MenuItem, Skeleton } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { userVar } from '../../apollo/store';
import {
	GET_AVAILABLE_HOTEL_ROOMS,
	GET_HOTEL_DETAIL,
	GET_HOTEL_REVIEWS,
	GET_HOTEL_ROOMS,
	SAVE_DETAIL_HOTEL,
	UNSAVE_DETAIL_HOTEL,
} from '../../apollo/hotelia/hotel-detail';
import PublicLayout from '../../libs/components/hotelia/PublicLayout';
import PhotoGallery from '../../libs/components/hotelia/PhotoGallery';
import StayAvailabilityForm from '../../libs/components/hotelia/StayAvailabilityForm';
import BookingRequestDialog from '../../libs/components/hotelia/BookingRequestDialog';
import { Button, Chip, EmptyState, Field, Pagination, SiteImage, formatUsd } from '../../libs/components/hotelia/ui';
import type {
	AvailableRoom,
	AvailableRooms,
	Comments,
	Hotel,
	Room,
	Rooms,
	StayInput,
} from '../../libs/types/hotelia/contracts';
import { CommentGroup, Direction, RoomSort, RoomType } from '../../libs/types/hotelia/enums';
import { canSelectRoom, estimateStay, parseRoomSelection } from '../../libs/booking/room-selection';
import { searchLabels } from '../../libs/search/hotel-search';

const labels: Record<string, string> = {
	...searchLabels,
	TV: 'TV',
	MINIBAR: 'Minibar',
	SAFE: 'Safe',
	BALCONY: 'Balcony',
	PRIVATE_BATHROOM: 'Private bathroom',
	QUEEN: 'Queen',
	KING: 'King',
	BUNK: 'Bunk',
};
const roomSortLabels: Record<RoomSort, string> = {
	NEWEST: 'Newest rooms',
	PRICE_ASC: 'Price: low to high',
	PRICE_DESC: 'Price: high to low',
};

export default function HotelDetail() {
	const router = useRouter(),
		client = useApolloClient(),
		user = useReactiveVar(userVar);
	const hotelId = typeof router.query.id === 'string' && /^[a-f\d]{24}$/i.test(router.query.id) ? router.query.id : '';
	const hotelQuery = useQuery<{ getHotel: Hotel }>(GET_HOTEL_DETAIL, {
		variables: { hotelId },
		skip: !router.isReady || !hotelId,
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
	});
	// Gate all inventory against this hotel response, so navigating between hotels cannot reuse a previous timezone.
	const hotel = hotelQuery.data?.getHotel?._id === hotelId ? hotelQuery.data.getHotel : undefined;
	const parsed = useMemo(
		() => parseRoomSelection(router.query, hotel?.hotelTimezone),
		[router.query, hotel?.hotelTimezone],
	);
	const enabled = router.isReady && !!hotel && !parsed.error;
	const collection = useQuery<{ getRooms: Rooms }>(GET_HOTEL_ROOMS, {
		variables: { input: parsed.roomInput },
		skip: !enabled || !!parsed.stay,
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
	});
	const available = useQuery<{ getAvailableRooms: AvailableRooms }>(GET_AVAILABLE_HOTEL_ROOMS, {
		variables: { input: parsed.availableInput },
		skip: !enabled || !parsed.stay,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
	const [reviewPage, setReviewPage] = useState(1),
		[selectedId, setSelectedId] = useState(''),
		[saving, setSaving] = useState(false),
		[message, setMessage] = useState('');
	const savePending = useRef(false);
	const [bookingOpen, setBookingOpen] = useState(false);
	const reviews = useQuery<{ getComments: Comments }>(GET_HOTEL_REVIEWS, {
		variables: {
			input: {
				page: reviewPage,
				limit: 4,
				sort: 'createdAt',
				direction: Direction.DESC,
				search: { commentRefId: hotelId, commentGroup: CommentGroup.HOTEL },
			},
		},
		skip: !router.isReady || !hotel,
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
	});
	const selectionKey = JSON.stringify([hotelId, parsed.availableInput, parsed.error]);
	useEffect(() => {
		setSelectedId('');
	}, [selectionKey]);
	useEffect(() => {
		setReviewPage(1);
		setMessage('');
	}, [hotelId]);
	const previousUser = useRef(user._id);
	useEffect(() => {
		if (previousUser.current !== user._id) {
			previousUser.current = user._id;
			if (hotelId) hotelQuery.refetch().catch(() => {});
		}
	}, [user._id, hotelId, hotelQuery.refetch]);
	const roomQuery = parsed.stay ? available : collection;
	const roomData = parsed.stay ? available.data?.getAvailableRooms : collection.data?.getRooms;
	const rooms = (roomData?.list || []).filter((room) => room.hotelId === hotelId);
	const selected =
		!roomQuery.loading && !roomQuery.error && !parsed.error && parsed.stay
			? rooms.find((room) => room._id === selectedId && canSelectRoom(room as AvailableRoom, parsed.stay!))
			: undefined;
	useEffect(() => {
		const restored = typeof router.query.selectedRoom === 'string' ? router.query.selectedRoom : '';
		if (
			restored &&
			!roomQuery.loading &&
			!roomQuery.error &&
			!parsed.error &&
			parsed.stay &&
			rooms.some((room) => room._id === restored && canSelectRoom(room as AvailableRoom, parsed.stay!))
		)
			setSelectedId(restored);
	}, [router.query.selectedRoom, roomQuery.loading, roomQuery.error, available.data, selectionKey]);
	useEffect(() => {
		setBookingOpen(false);
	}, [selectionKey]);
	const total = roomData?.metaCounter[0]?.total || 0;
	const estimate =
		selected && parsed.stay ? estimateStay(selected.roomPrice, parsed.nights, parsed.stay.rooms || 1) : undefined;
	const update = (values: Record<string, string>, resetPage = true) => {
		const query: typeof router.query = { ...router.query, ...values, ...(resetPage ? { roomPage: '1' } : {}) };
		delete query.selectedRoom;
		return router.push({ pathname: '/property/detail', query }, undefined, { scroll: false });
	};
	const applyStay = async (stay: StayInput) => {
		const unchanged =
			!parsed.error &&
			parsed.roomInput.page === 1 &&
			parsed.stay?.checkIn === stay.checkIn &&
			parsed.stay?.checkOut === stay.checkOut &&
			parsed.stay?.guests === stay.guests &&
			(parsed.stay?.rooms || 1) === (stay.rooms || 1);
		setSelectedId('');
		await update({
			checkIn: stay.checkIn,
			checkOut: stay.checkOut,
			guests: String(stay.guests),
			rooms: String(stay.rooms || 1),
		});
		// Rechecking the same dates must still refresh inventory changed by other bookings.
		if (unchanged) await available.refetch();
	};
	const navigate = (values: Record<string, string>, resetPage = true) => {
		update(values, resetPage).catch(() => setMessage('Could not update your stay. Try again.'));
	};
	const save = async () => {
		if (!hotel || savePending.current) return;
		if (!user._id) {
			await router.push({ pathname: '/account/join', query: { referrer: router.asPath } });
			return;
		}
		savePending.current = true;
		setSaving(true);
		setMessage('');
		try {
			const result = await client.mutate({
				mutation: hotel.isFavorite ? UNSAVE_DETAIL_HOTEL : SAVE_DETAIL_HOTEL,
				variables: { hotelId },
			});
			const saved = result.data?.[hotel.isFavorite ? 'unfavoriteHotel' : 'favoriteHotel'];
			if (!saved) throw Error('No result');
			client.cache.modify({
				id: client.cache.identify({ __typename: 'Hotel', _id: hotelId }),
				fields: { isFavorite: () => saved.isFavorite, hotelLikes: () => saved.hotelLikes },
			});
		} catch {
			setMessage('Could not update your saved stays. Try again.');
		} finally {
			savePending.current = false;
			setSaving(false);
		}
	};
	let content;
	if (!router.isReady || (hotelQuery.loading && !hotel))
		content = (
			<div className="h-detail-loading" aria-label="Loading hotel" aria-busy="true">
				<Skeleton width="60%" height={75} />
				<Skeleton variant="rectangular" height={440} />
			</div>
		);
	else if (!hotelId)
		content = (
			<EmptyState
				error
				title="Choose a hotel"
				description="Open a stay from the hotel catalog."
				action={<Button href="/property">Explore stays</Button>}
			/>
		);
	else if (hotelQuery.error || !hotel)
		content = (
			<EmptyState
				error
				title="This stay could not load"
				description="It may no longer be available. Try again or explore other stays."
				action={
					<>
						<Button onClick={() => hotelQuery.refetch().catch(() => {})}>Try again</Button>
						<Button href="/property" variant="text">
							Explore stays
						</Button>
					</>
				}
			/>
		);
	else
		content = (
			<>
				<nav className="h-detail-breadcrumb" aria-label="Breadcrumb">
					<Link href="/property">Stays</Link>
					<span>›</span>
					<Link href={{ pathname: '/property', query: { destination: hotel.hotelCity } }}>{hotel.hotelCity}</Link>
					<span>›</span>
					<span>{hotel.hotelName}</span>
				</nav>
				<div className="h-detail-heading">
					<div>
						<span className="h-eyebrow">{labels[hotel.hotelType]}</span>
						<h1>{hotel.hotelName}</h1>
						<div className="h-detail-meta">
							<span>
								<LocationOnOutlinedIcon fontSize="small" />
								{hotel.hotelCity}, {hotel.hotelCountry}
							</span>
							{hotel.hotelReviews > 0 && (
								<a href="#guest-reviews">
									<StarRoundedIcon fontSize="small" />
									{hotel.hotelRating.toFixed(1)} · {hotel.hotelReviews} reviews
								</a>
							)}
						</div>
					</div>
					<Button
						variant="outlined"
						disabled={saving}
						onClick={save}
						startIcon={hotel.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
						aria-pressed={!!hotel.isFavorite}
					>
						{saving ? 'Saving…' : hotel.isFavorite ? 'Saved' : 'Save stay'}
					</Button>
				</div>
				{message && (
					<Alert severity="error" onClose={() => setMessage('')}>
						{message}
					</Alert>
				)}
				<PhotoGallery key={hotelId} images={hotel.hotelImages} name={hotel.hotelName} />
				<div className="h-detail-columns">
					<div className="h-detail-content">
						<section className="h-detail-section h-detail-about">
							<span className="h-eyebrow">The property</span>
							<h2>A little closer.</h2>
							<p>{hotel.hotelDescription}</p>
						</section>
						<section className="h-detail-section">
							<div className="h-detail-section-title">
								<h2>Little essentials</h2>
								<span className="h-eyebrow">Amenities</span>
							</div>
							<div className="h-detail-amenities">
								{hotel.hotelAmenities.map((amenity) => (
									<span key={amenity}>
										<CheckCircleOutlineIcon fontSize="small" />
										{labels[amenity]}
									</span>
								))}
							</div>
						</section>
						{hotel.memberData && (
							<section className="h-detail-host">
								{hotel.memberData.memberImage ? (
									<SiteImage src={hotel.memberData.memberImage} alt={hotel.memberData.memberNick} />
								) : (
									<span className="h-host-initial" aria-hidden="true">
										{hotel.memberData.memberNick.slice(0, 1)}
									</span>
								)}
								<div>
									<span className="h-eyebrow">Your host</span>
									<h3>{hotel.memberData.memberNick}</h3>
									{hotel.memberData.memberDesc && <p>{hotel.memberData.memberDesc}</p>}
								</div>
								<Link className="h-text-link" href={{ pathname: '/agent/detail', query: { agentId: hotel.ownerId } }}>
									View host ↗
								</Link>
							</section>
						)}
						<section className="h-detail-section" id="hotel-rooms">
							<div className="h-detail-section-title">
								<h2>{parsed.stay ? 'Available accommodations' : 'The room collection'}</h2>
								{parsed.stay && !parsed.error && <Chip tone="success">{parsed.nights} nights</Chip>}
							</div>
							<p className="h-room-context">
								{parsed.stay
									? `${parsed.stay.checkIn} — ${parsed.stay.checkOut} · ${parsed.stay.guests} guests · ${
											parsed.stay.rooms || 1
									  } rooms`
									: 'Choose dates to check availability.'}
							</p>
							<div className="h-room-filters">
								<Field
									select
									label="Room type"
									value={parsed.roomInput.roomType || ''}
									onChange={(event) => navigate({ roomType: event.target.value })}
								>
									<MenuItem value="">Any room</MenuItem>
									{Object.values(RoomType).map((value) => (
										<MenuItem key={value} value={value}>
											{labels[value]}
										</MenuItem>
									))}
								</Field>
								<Field
									select
									label="Room order"
									value={parsed.roomInput.sort}
									onChange={(event) => navigate({ roomSort: event.target.value })}
								>
									{Object.values(RoomSort).map((value) => (
										<MenuItem key={value} value={value}>
											{roomSortLabels[value]}
										</MenuItem>
									))}
								</Field>
							</div>
							{parsed.error ? (
								<EmptyState
									error
									title="Check your stay"
									description={parsed.error}
									action={
										<Button
											variant="outlined"
											onClick={() =>
												router.push({ pathname: '/property/detail', query: { id: hotelId } }).catch(() => {})
											}
										>
											Reset stay
										</Button>
									}
								/>
							) : roomQuery.loading ? (
								<div aria-label="Loading rooms" aria-busy="true">
									<Skeleton variant="rectangular" height={180} />
									<Skeleton height={180} />
								</div>
							) : roomQuery.error ? (
								<EmptyState
									error
									title="Rooms could not load"
									description="Try again in a moment."
									action={<Button onClick={() => roomQuery.refetch().catch(() => {})}>Try again</Button>}
								/>
							) : !rooms.length ? (
								<EmptyState
									title={parsed.stay ? 'No rooms for this stay' : 'Rooms are on their way'}
									description={
										parsed.stay
											? 'Try different dates, fewer rooms, or another stay.'
											: 'This hotel has no published rooms yet.'
									}
									action={
										<Button href="/property" variant="outlined">
											Explore stays
										</Button>
									}
								/>
							) : (
								<div className="h-room-list">
									{rooms.map((room: Room) => {
										const eligible =
											parsed.stay && 'availableQuantity' in room && canSelectRoom(room as AvailableRoom, parsed.stay);
										return (
											<article
												className={`h-room-card ${selected?._id === room._id ? 'h-room-card--selected' : ''}`}
												key={room._id}
											>
												<SiteImage src={room.roomImages[0]} alt={room.roomName} />
												<div className="h-room-card-content">
													<div className="h-room-card-heading">
														<h3>{room.roomName}</h3>
														{selected?._id === room._id && <Chip tone="success">Selected</Chip>}
													</div>
													<p>
														{room.roomSize} m² · {labels[room.bedType]} bed · Up to {room.roomCapacity} guests / room
													</p>
													{room.roomDescription && <p className="h-room-description">{room.roomDescription}</p>}
													<div className="h-chips">
														{room.roomAmenities.map((amenity) => (
															<Chip key={amenity}>{labels[amenity]}</Chip>
														))}
													</div>
													{parsed.stay && (
														<span className="h-room-availability">
															{(room as AvailableRoom).availableQuantity} rooms available
														</span>
													)}
													<div className="h-room-card-bottom">
														<span className="h-price">
															{formatUsd(room.roomPrice)}
															<small>/ night / room</small>
														</span>
														{parsed.stay ? (
															<Button
																variant={selected?._id === room._id ? 'outlined' : 'contained'}
																disabled={!eligible}
																aria-pressed={selected?._id === room._id}
																onClick={() => setSelectedId(room._id)}
															>
																{selected?._id === room._id ? 'Selected' : 'Select room'}
															</Button>
														) : (
															<Button variant="outlined" href="#stay-search">
																Choose dates
															</Button>
														)}
													</div>
												</div>
											</article>
										);
									})}
								</div>
							)}
							{!parsed.error && !roomQuery.loading && !roomQuery.error && (
								<Pagination
									page={parsed.roomInput.page || 1}
									limit={6}
									total={total}
									onChange={(page) => navigate({ roomPage: String(page) }, false)}
								/>
							)}
							{!parsed.error &&
								!roomQuery.loading &&
								!roomQuery.error &&
								(parsed.roomInput.page || 1) > 1 &&
								!rooms.length && <Button onClick={() => navigate({ roomPage: '1' }, false)}>First room page</Button>}
						</section>
						<section className="h-detail-section" id="guest-reviews">
							<div className="h-detail-section-title">
								<h2>Guest reviews</h2>
								<span className="h-eyebrow">Completed stays</span>
							</div>
							{reviews.loading ? (
								<Skeleton height={130} />
							) : reviews.error ? (
								<EmptyState
									error
									title="Reviews could not load"
									action={<Button onClick={() => reviews.refetch().catch(() => {})}>Try again</Button>}
								/>
							) : !reviews.data?.getComments.list.length ? (
								<EmptyState title="Your story could be the first" description="Reviews appear after completed stays." />
							) : (
								<div className="h-review-list">
									{reviews.data.getComments.list.map((review) => (
										<article key={review._id} className="h-review">
											<div>
												<strong>{review.memberData?.memberNick || 'Hotelia guest'}</strong>
												{review.rating != null && (
													<span className="h-rating">
														<StarRoundedIcon fontSize="small" />
														{review.rating.toFixed(1)}
													</span>
												)}
											</div>
											<p>“{review.commentContent}”</p>
											{review.bookingId && <span className="h-eyebrow">Verified stay</span>}
										</article>
									))}
								</div>
							)}
							{!reviews.loading && !reviews.error && (
								<Pagination
									page={reviewPage}
									total={reviews.data?.getComments.metaCounter?.[0]?.total || 0}
									limit={4}
									onChange={setReviewPage}
								/>
							)}
						</section>
						<section className="h-detail-section h-detail-address">
							<span className="h-eyebrow">The neighborhood</span>
							<h2>{hotel.hotelCity}</h2>
							<p>{hotel.hotelAddress}</p>
							<a
								className="h-text-link"
								href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
									`${hotel.hotelAddress}, ${hotel.hotelCity}, ${hotel.hotelCountry}`,
								)}`}
								target="_blank"
								rel="noreferrer"
							>
								View on map ↗
							</a>
						</section>
					</div>
					<aside className="h-detail-sidebar">
						<div className="h-stay-panel">
							<StayAvailabilityForm
								hotelId={hotelId}
								timezone={hotel.hotelTimezone}
								stay={parsed.stay}
								guests={Number(router.query.guests) || 2}
								rooms={Number(router.query.rooms) || 1}
								onApply={applyStay}
							/>
							<div className="h-stay-summary" aria-live="polite">
								<span className="h-eyebrow">Your selection</span>
								{selected ? (
									<>
										<h3>{selected.roomName}</h3>
										<dl>
											<div>
												<dt>Duration</dt>
												<dd>{parsed.nights} nights</dd>
											</div>
											<div>
												<dt>Occupancy</dt>
												<dd>
													{parsed.stay?.guests} guests · {parsed.stay?.rooms || 1} rooms
												</dd>
											</div>
											<div>
												<dt>Nightly rate</dt>
												<dd>{formatUsd(selected.roomPrice)}</dd>
											</div>
										</dl>
										{estimate !== undefined && (
											<div className="h-stay-estimate">
												<span>
													Estimated total <small>USD</small>
												</span>
												<strong>{formatUsd(estimate)}</strong>
											</div>
										)}
										<p className="h-stay-note">Final price is confirmed when you request your stay.</p>
										<Button fullWidth color="secondary" onClick={() => setBookingOpen(true)}>
											Request booking
										</Button>
									</>
								) : (
									<p>
										{parsed.stay
											? 'Select an available room to see your stay estimate.'
											: 'Choose your dates, then find your room.'}
									</p>
								)}
							</div>
						</div>
					</aside>
				</div>
				{bookingOpen && selected && parsed.stay && (
					<BookingRequestDialog
						hotel={hotel}
						room={selected as AvailableRoom}
						stay={parsed.stay}
						open
						onClose={() => setBookingOpen(false)}
						onBooked={() => {
							setSelectedId('');
							void update({}, false);
							void available.refetch().catch(() => {});
						}}
					/>
				)}
			</>
		);
	return (
		<PublicLayout>
			<Head>
				<title>{hotel ? `${hotel.hotelName} · Hotelia` : 'Hotel · Hotelia'}</title>
				<meta
					name="description"
					content={hotel?.hotelDescription?.slice(0, 160) || 'Find your next stay with Hotelia.'}
				/>
			</Head>
			<div className="h-container h-hotel-detail">{content}</div>
		</PublicLayout>
	);
}
