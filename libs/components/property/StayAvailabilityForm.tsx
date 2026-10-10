import { Alert } from '@mui/material';
import { FormEvent, useEffect, useState } from 'react';
import { hotelLocalToday, parseRoomSelection } from '../../booking/room-selection';
import type { StayInput } from '../../types/contracts';
import { Button, Field } from '../common/ui';

export default function StayAvailabilityForm({
	hotelId,
	timezone,
	stay,
	guests = 2,
	rooms = 1,
	onApply,
}: {
	hotelId: string;
	timezone: string;
	stay?: StayInput;
	guests?: number;
	rooms?: number;
	onApply: (stay: StayInput) => Promise<unknown>;
}) {
	const [arrival, setArrival] = useState(stay?.checkIn || ''),
		[departure, setDeparture] = useState(stay?.checkOut || '');
	const [guestCount, setGuestCount] = useState(String(guests)),
		[roomCount, setRoomCount] = useState(String(rooms));
	const [error, setError] = useState(''),
		[pending, setPending] = useState(false);
	useEffect(() => {
		setArrival(stay?.checkIn || '');
		setDeparture(stay?.checkOut || '');
		setGuestCount(String(stay?.guests || guests));
		setRoomCount(String(stay?.rooms || rooms));
		setError('');
	}, [stay?.checkIn, stay?.checkOut, stay?.guests, stay?.rooms, guests, rooms, hotelId]);
	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (pending) return;
		const fields = new FormData(event.currentTarget);
		const parsed = parseRoomSelection(
			{
				id: hotelId,
				checkIn: String(fields.get('checkIn') || ''),
				checkOut: String(fields.get('checkOut') || ''),
				guests: String(fields.get('guests') || ''),
				rooms: String(fields.get('rooms') || ''),
			},
			timezone,
		);
		if (parsed.error || !parsed.stay) {
			setError(parsed.error || 'Choose your stay dates.');
			return;
		}
		setError('');
		setPending(true);
		try {
			await onApply(parsed.stay);
		} catch {
			setError('Could not update dates. Please try again.');
		} finally {
			setPending(false);
		}
	};
	return (
		<form className="h-stay-form" id="stay-search" onSubmit={submit} aria-label="Check room availability">
			<h2>Your stay</h2>
			<div className="h-stay-fields">
				<Field
					label="Arrival"
					name="checkIn"
					type="date"
					required
					InputLabelProps={{ shrink: true }}
					inputProps={{ min: hotelLocalToday(timezone) }}
					value={arrival}
					onInput={(event) => setArrival((event.target as HTMLInputElement).value)}
					onChange={(event) => setArrival(event.target.value)}
				/>
				<Field
					label="Departure"
					name="checkOut"
					type="date"
					required
					InputLabelProps={{ shrink: true }}
					inputProps={{ min: arrival || hotelLocalToday(timezone) }}
					value={departure}
					onInput={(event) => setDeparture((event.target as HTMLInputElement).value)}
					onChange={(event) => setDeparture(event.target.value)}
				/>
				<Field
					label="Guests"
					name="guests"
					type="number"
					required
					inputProps={{ min: 1, max: 2147483647, step: 1 }}
					value={guestCount}
					onChange={(event) => setGuestCount(event.target.value)}
				/>
				<Field
					label="Rooms"
					name="rooms"
					type="number"
					required
					inputProps={{ min: 1, max: 2147483647, step: 1 }}
					value={roomCount}
					onChange={(event) => setRoomCount(event.target.value)}
				/>
			</div>
			{error && <Alert severity="error">{error}</Alert>}
			<Button type="submit" fullWidth color="secondary" disabled={pending}>
				{pending ? 'Updating…' : 'Check availability'}
			</Button>
		</form>
	);
}
