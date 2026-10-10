import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useReadyRouter as useRouter } from '../../hooks/useReadyRouter';
import { useRef, useState } from 'react';
import { CREATE_HOTEL, OWNER_HOTEL, UPDATE_HOTEL } from '../../../apollo/owner/owner';
import { userVar } from '../../../apollo/store';
import { useOwnerRefresh } from '../../hooks/useOwnerRefresh';
import { hotelInput, ownerError } from '../../owner/model';
import { isMemberId } from '../../social/query';
import { Hotel, HotelInput } from '../../types/contracts';
import { HotelAmenity, HotelType, MemberType } from '../../enums';
import { Button, EmptyState, Field } from '../common/ui';
import { Amenities, PhotoField, SelectField } from './EditorFields';

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
					<span className="h-eyebrow">Hotel setup</span>
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
						<span className="h-eyebrow">01 · Hotel basics</span>
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
