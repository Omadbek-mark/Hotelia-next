import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useReactiveVar } from '@apollo/client';
import {
	OWNER_HOTEL,
	OWNER_ROOM,
	CREATE_HOTEL,
	UPDATE_HOTEL,
	CREATE_ROOM,
	UPDATE_ROOM,
} from '../../../apollo/hotelia/owner';
import { userVar } from '../../../apollo/store';
import { Hotel, HotelInput, Room, RoomInput } from '../../types/hotelia/contracts';
import { HotelType, HotelAmenity, RoomType, RoomAmenity, BedType, MemberType } from '../../types/hotelia/enums';
import { hotelInput, roomInput, label, ownerError } from '../../owner/model';
import { isMemberId } from '../../social/query';
import { uploadImages } from '../../api/upload';
import { Button, Field, SiteImage, EmptyState } from './ui';
import { useOwnerRefresh } from './OwnerInventory';
function PhotoField({
	value,
	onChange,
	target,
	busy,
	onBusy,
	onError,
}: {
	value: string[];
	onChange: (v: string[]) => void;
	target: 'hotel' | 'room';
	busy: boolean;
	onBusy: (v: boolean) => void;
	onError: (v: string) => void;
}) {
	const lock = useRef(false),
		owner = useReactiveVar(userVar);
	return (
		<div className="h-owner-photos">
			<div className="h-owner-section-heading">
				<h2>Photography</h2>
				<span>{value.length} / 20</span>
			</div>
			<div className="h-owner-photo-grid">
				{value.map((src, index) => (
					<div key={src}>
						<SiteImage src={src} alt={`${target} photo ${index + 1}`} />
						<small>{index === 0 ? 'Cover photo' : `Photo ${index + 1}`}</small>
						<div>
							<Button
								variant="text"
								size="small"
								disabled={busy}
								onClick={() => onChange(value.filter((_, i) => i !== index))}
								aria-label={`Remove photo ${index + 1}`}
							>
								Remove
							</Button>
							{index > 0 && (
								<Button
									variant="text"
									size="small"
									disabled={busy}
									onClick={() => onChange([src, ...value.filter((_, i) => i !== index)])}
									aria-label={`Make photo ${index + 1} cover`}
								>
									Make cover
								</Button>
							)}
						</div>
					</div>
				))}
			</div>
			<Button component="label" variant="outlined" disabled={busy || value.length === 20}>
				{busy ? 'Uploading…' : 'Add photos +'}
				<input
					type="file"
					hidden
					multiple
					accept="image/jpeg,image/png"
					onChange={async (e) => {
						const files = Array.from(e.target.files || []);
						e.target.value = '';
						if (!files.length || lock.current) return;
						if (files.length > 10 || value.length + files.length > 20) {
							onError('Choose up to 10 photos at once, with no more than 20 in total.');
							return;
						}
						const ownerId = owner._id;
						lock.current = true;
						onBusy(true);
						onError('');
						try {
							const paths = await uploadImages(files, target);
							if (userVar()._id === ownerId) onChange(Array.from(new Set([...value, ...paths])));
						} catch (e) {
							onError((e as Error).message);
						} finally {
							lock.current = false;
							onBusy(false);
						}
					}}
				/>
			</Button>
			<small>JPG or PNG · up to 15 MB each · 1–20 photos</small>
		</div>
	);
}
function Amenities({
	value,
	onChange,
	options,
	disabled,
}: {
	value: string[];
	onChange: (v: any[]) => void;
	options: string[];
	disabled: boolean;
}) {
	return (
		<fieldset className="h-owner-amenity-options">
			<legend>Amenities</legend>
			{options.map((option) => (
				<label key={option}>
					<input
						type="checkbox"
						disabled={disabled}
						checked={value.includes(option)}
						onChange={(e) => onChange(e.target.checked ? [...value, option] : value.filter((v) => v !== option))}
					/>
					{label(option)}
				</label>
			))}
		</fieldset>
	);
}
function SelectField({
	title,
	value,
	onChange,
	options,
	disabled,
}: {
	title: string;
	value: string;
	onChange: (v: any) => void;
	options: string[];
	disabled: boolean;
}) {
	return (
		<Field
			label={title}
			select
			value={value}
			disabled={disabled}
			SelectProps={{ native: true }}
			onChange={(e) => onChange(e.target.value)}
		>
			{options.map((v) => (
				<option key={v} value={v}>
					{label(v)}
				</option>
			))}
		</Field>
	);
}
const hotelBlank: HotelInput = {
	hotelName: '',
	hotelDescription: '',
	hotelCountry: '',
	hotelCity: '',
	hotelAddress: '',
	hotelTimezone: 'Asia/Seoul',
	hotelType: HotelType.HOTEL,
	hotelImages: [],
	hotelAmenities: [],
};
function HotelForm({ hotel }: { hotel?: Hotel }) {
	const router = useRouter(),
		user = useReactiveVar(userVar),
		owner = useRef(user._id),
		lock = useRef(false),
		refresh = useOwnerRefresh();
	const [value, setValue] = useState<HotelInput>(hotel ? hotelInput(hotel) : hotelBlank),
		[status, setStatus] = useState(hotel?.hotelStatus || 'ACTIVE'),
		[busy, setBusy] = useState(false),
		[uploading, setUploading] = useState(false),
		[uncertain, setUncertain] = useState(false),
		[error, setError] = useState('');
	const [create] = useMutation(CREATE_HOTEL),
		[update] = useMutation(UPDATE_HOTEL),
		disabled = busy || uploading;
	const field = (key: keyof HotelInput, title: string, max: number, multiline = false) => (
		<Field
			label={title}
			value={value[key]}
			disabled={disabled}
			multiline={multiline}
			minRows={multiline ? 4 : undefined}
			inputProps={{ maxLength: max }}
			onChange={(e) => setValue({ ...value, [key]: e.target.value })}
		/>
	);
	const save = async () => {
		if (lock.current || uploading || uncertain) return;
		setError('');
		let input;
		try {
			input = hotelInput(value);
		} catch (e) {
			setError((e as Error).message);
			return;
		}
		if (user.memberType !== MemberType.HOTEL_OWNER || user._id !== owner.current) return;
		lock.current = true;
		setBusy(true);
		try {
			const response = hotel
				? await update({ variables: { input: { _id: hotel._id, ...input, hotelStatus: status } } })
				: await create({ variables: { input } });
			const id = hotel ? hotel._id : response.data?.createHotel?._id;
			if (!id) throw new Error();
			await refresh();
			await router.push(`/owner?tab=rooms&hotelId=${id}`);
		} catch (e) {
			if (!hotel) setUncertain(true);
			setError(ownerError(e) + (hotel ? '' : ' Check My hotels before creating another listing.'));
		} finally {
			setBusy(false);
			lock.current = false;
		}
	};
	return (
		<section className="h-owner-editor">
			<Button variant="text" href="/owner?tab=hotels">
				← My hotels
			</Button>
			<header className="h-owner-heading">
				<div>
					<span className="h-eyebrow">Property setup</span>
					<h1>{hotel ? 'Edit hotel' : 'Add a new hotel'}</h1>
					<p>A distinctive stay, down to the details.</p>
				</div>
				<Button onClick={save} disabled={disabled || uncertain}>
					{busy ? 'Saving…' : 'Save hotel'}
				</Button>
			</header>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					void save();
				}}
			>
				<div className="h-owner-editor-grid">
					<div className="h-owner-form-panel">
						<span className="h-eyebrow">01 · Property basics</span>
						{field('hotelName', 'Hotel name', 100)}
						{field('hotelDescription', 'Description', 5000, true)}
						<SelectField
							title="Hotel type"
							value={value.hotelType}
							options={Object.values(HotelType)}
							disabled={disabled}
							onChange={(hotelType) => setValue({ ...value, hotelType })}
						/>
						<span className="h-eyebrow">02 · Location</span>
						<div className="h-owner-field-pair">
							{field('hotelCountry', 'Country', 100)}
							{field('hotelCity', 'City', 100)}
						</div>
						{field('hotelAddress', 'Street address', 300)}
						<Field
							label="Timezone"
							value={value.hotelTimezone}
							disabled={disabled}
							onChange={(e) => setValue({ ...value, hotelTimezone: e.target.value })}
							helperText="For arrival and departure dates. Example: Asia/Seoul"
						/>
						<Amenities
							value={value.hotelAmenities}
							options={Object.values(HotelAmenity)}
							disabled={disabled}
							onChange={(hotelAmenities) => setValue({ ...value, hotelAmenities })}
						/>
						{hotel && (
							<SelectField
								title="Listing status"
								value={status}
								options={['ACTIVE', 'PAUSED']}
								disabled={disabled}
								onChange={setStatus}
							/>
						)}
					</div>
					<aside className="h-owner-form-panel">
						<span className="h-eyebrow">03 · First impressions</span>
						<PhotoField
							value={value.hotelImages}
							target="hotel"
							busy={disabled}
							onBusy={setUploading}
							onError={setError}
							onChange={(hotelImages) => setValue((v) => ({ ...v, hotelImages }))}
						/>
						<div className="h-owner-note">
							<h3>Ready for your guests</h3>
							<p>
								{hotel
									? 'Pausing hides your listing from discovery. Existing reservations remain.'
									: 'Your new hotel starts active. Add room types next to welcome bookings.'}
							</p>
						</div>
					</aside>
				</div>
				{error && (
					<p role="alert" className="h-owner-error">
						{error}
					</p>
				)}
				<footer className="h-owner-form-footer">
					<Button variant="text" href="/owner?tab=hotels">
						Cancel
					</Button>
					<Button type="submit" disabled={disabled || uncertain}>
						{busy ? 'Saving…' : 'Save & manage rooms →'}
					</Button>
				</footer>
			</form>
		</section>
	);
}
export function OwnerHotelEditor() {
	const router = useRouter(),
		user = useReactiveVar(userVar),
		id = router.query.hotelId,
		valid = id === undefined || isMemberId(id),
		result = useQuery<{ getOwnerHotel: Hotel }>(OWNER_HOTEL, {
			variables: { hotelId: id },
			skip: !router.isReady || !id || !valid || user.memberType !== MemberType.HOTEL_OWNER,
			fetchPolicy: 'network-only',
		});
	if (!valid) return <EmptyState title="Invalid hotel link" />;
	if (!router.isReady || (id && result.loading)) return <EmptyState title="Opening hotel…" />;
	if (id && (result.error || !result.data?.getOwnerHotel || result.data.getOwnerHotel.ownerId !== user._id))
		return (
			<EmptyState
				error
				title="This hotel cannot be edited"
				action={<Button href="/owner?tab=hotels">My hotels</Button>}
			/>
		);
	return <HotelForm key={`${user._id}:${id || 'new'}`} hotel={result.data?.getOwnerHotel} />;
}
function RoomForm({ hotel, room }: { hotel: Hotel; room?: Room }) {
	const router = useRouter(),
		user = useReactiveVar(userVar),
		owner = useRef(user._id),
		lock = useRef(false),
		refresh = useOwnerRefresh();
	const [value, setValue] = useState<RoomInput>(
			room
				? roomInput(room)
				: {
						hotelId: hotel._id,
						roomName: '',
						roomDescription: '',
						roomType: RoomType.DOUBLE,
						bedType: BedType.QUEEN,
						roomPrice: 0,
						roomCapacity: 2,
						roomQuantity: 1,
						roomSize: 20,
						roomImages: [],
						roomAmenities: [],
				  },
		),
		[status, setStatus] = useState(room?.roomStatus || 'ACTIVE'),
		[busy, setBusy] = useState(false),
		[uploading, setUploading] = useState(false),
		[uncertain, setUncertain] = useState(false),
		[error, setError] = useState('');
	const [create] = useMutation(CREATE_ROOM),
		[update] = useMutation(UPDATE_ROOM),
		disabled = busy || uploading;
	const number = (key: 'roomPrice' | 'roomSize' | 'roomCapacity' | 'roomQuantity', title: string, step: number) => (
		<Field
			label={title}
			type="number"
			value={Number.isNaN(value[key]) ? '' : value[key]}
			disabled={disabled}
			inputProps={{ min: step, step, max: key === 'roomCapacity' || key === 'roomQuantity' ? 2147483647 : undefined }}
			onChange={(e) => setValue({ ...value, [key]: e.target.value === '' ? NaN : Number(e.target.value) })}
		/>
	);
	const save = async () => {
		if (lock.current || uploading || uncertain) return;
		setError('');
		let input;
		try {
			input = roomInput(value);
		} catch (e) {
			setError((e as Error).message);
			return;
		}
		if (user.memberType !== MemberType.HOTEL_OWNER || user._id !== owner.current) return;
		lock.current = true;
		setBusy(true);
		try {
			if (room) {
				const { hotelId, ...editable } = input;
				await update({ variables: { input: { _id: room._id, ...editable, roomStatus: status } } });
			} else await create({ variables: { input } });
			await refresh();
			await router.push(`/owner?tab=rooms&hotelId=${hotel._id}`);
		} catch (e) {
			if (!room) setUncertain(true);
			setError(ownerError(e) + (room ? '' : ' Check Room inventory before creating another room type.'));
		} finally {
			setBusy(false);
			lock.current = false;
		}
	};
	return (
		<section className="h-owner-editor">
			<Button variant="text" href={`/owner?tab=rooms&hotelId=${hotel._id}`}>
				← Room inventory
			</Button>
			<header className="h-owner-heading">
				<div>
					<span className="h-eyebrow">{hotel.hotelName}</span>
					<h1>{room ? 'Edit room type' : 'Add a room type'}</h1>
					<p>Space, comfort and a considered nightly rate.</p>
				</div>
				<Button onClick={save} disabled={disabled || uncertain}>
					{busy ? 'Saving…' : 'Save room'}
				</Button>
			</header>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					void save();
				}}
			>
				<div className="h-owner-editor-grid">
					<div className="h-owner-form-panel">
						<span className="h-eyebrow">01 · Room details</span>
						<Field
							label="Room name"
							value={value.roomName}
							disabled={disabled}
							inputProps={{ maxLength: 100 }}
							onChange={(e) => setValue({ ...value, roomName: e.target.value })}
						/>
						<SelectField
							title="Room type"
							value={value.roomType}
							options={Object.values(RoomType)}
							disabled={disabled}
							onChange={(roomType) => setValue({ ...value, roomType })}
						/>
						<Field
							label="Description"
							multiline
							minRows={4}
							disabled={disabled}
							value={value.roomDescription}
							inputProps={{ maxLength: 5000 }}
							onChange={(e) => setValue({ ...value, roomDescription: e.target.value })}
						/>
						<Amenities
							value={value.roomAmenities}
							options={Object.values(RoomAmenity)}
							disabled={disabled}
							onChange={(roomAmenities) => setValue({ ...value, roomAmenities })}
						/>
						<span className="h-eyebrow">02 · Capacity & layout</span>
						<SelectField
							title="Bed type"
							value={value.bedType}
							options={Object.values(BedType)}
							disabled={disabled}
							onChange={(bedType) => setValue({ ...value, bedType })}
						/>
						<div className="h-owner-field-pair">
							{number('roomSize', 'Room size (m²)', 0.01)}
							{number('roomCapacity', 'Guest limit', 1)}
							{number('roomQuantity', 'Units in inventory', 1)}
							{number('roomPrice', 'Nightly price (USD)', 0.01)}
						</div>
						{room && (
							<SelectField
								title="Room status"
								value={status}
								options={['ACTIVE', 'PAUSED']}
								disabled={disabled}
								onChange={setStatus}
							/>
						)}
					</div>
					<aside className="h-owner-form-panel">
						<span className="h-eyebrow">03 · Room photography</span>
						<PhotoField
							target="room"
							value={value.roomImages}
							busy={disabled}
							onBusy={setUploading}
							onError={setError}
							onChange={(roomImages) => setValue((v) => ({ ...v, roomImages }))}
						/>
						<div className="h-owner-note">
							<h3>Keep room for confirmed stays</h3>
							<p>
								Existing reservations may prevent reducing units or guest capacity. Pausing keeps their records intact.
							</p>
						</div>
					</aside>
				</div>
				{error && (
					<p role="alert" className="h-owner-error">
						{error}
					</p>
				)}
				<footer className="h-owner-form-footer">
					<Button variant="text" href={`/owner?tab=rooms&hotelId=${hotel._id}`}>
						Cancel
					</Button>
					<Button type="submit" disabled={disabled || uncertain}>
						{busy ? 'Saving…' : 'Save room specification'}
					</Button>
				</footer>
			</form>
		</section>
	);
}
export function OwnerRoomEditor() {
	const router = useRouter(),
		user = useReactiveVar(userVar),
		hotelId = router.query.hotelId,
		roomId = router.query.roomId,
		valid = isMemberId(hotelId) && (roomId === undefined || isMemberId(roomId)),
		skip = !router.isReady || !valid || user.memberType !== MemberType.HOTEL_OWNER;
	const hotel = useQuery<{ getOwnerHotel: Hotel }>(OWNER_HOTEL, {
			variables: { hotelId },
			skip,
			fetchPolicy: 'network-only',
		}),
		room = useQuery<{ getOwnerRoom: Room }>(OWNER_ROOM, {
			variables: { roomId },
			skip: skip || !roomId,
			fetchPolicy: 'network-only',
		});
	if (!valid)
		return (
			<EmptyState
				title="Choose a valid hotel and room"
				action={<Button href="/owner?tab=rooms">Room inventory</Button>}
			/>
		);
	if (!router.isReady || hotel.loading || (roomId && room.loading)) return <EmptyState title="Opening room…" />;
	if (
		hotel.error ||
		!hotel.data?.getOwnerHotel ||
		hotel.data.getOwnerHotel.ownerId !== user._id ||
		(roomId && (room.error || !room.data?.getOwnerRoom || room.data.getOwnerRoom.hotelId !== hotelId))
	)
		return (
			<EmptyState
				error
				title="This room cannot be edited"
				action={<Button href="/owner?tab=rooms">Room inventory</Button>}
			/>
		);
	return (
		<RoomForm
			key={`${user._id}:${hotelId}:${roomId || 'new'}`}
			hotel={hotel.data.getOwnerHotel}
			room={room.data?.getOwnerRoom}
		/>
	);
}
