import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useReadyRouter as useRouter } from '../../hooks/useReadyRouter';
import { useRef, useState } from 'react';
import { CREATE_ROOM, OWNER_HOTEL, OWNER_ROOM, UPDATE_ROOM } from '../../../apollo/owner/owner';
import { userVar } from '../../../apollo/store';
import { useOwnerRefresh } from '../../hooks/useOwnerRefresh';
import { ownerError, roomInput } from '../../owner/model';
import { isMemberId } from '../../social/query';
import { Hotel, Room, RoomInput } from '../../types/contracts';
import { BedType, MemberType, RoomAmenity, RoomType } from '../../enums';
import { Button, EmptyState, Field } from '../common/ui';
import { Amenities, PhotoField, SelectField } from './EditorFields';

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
