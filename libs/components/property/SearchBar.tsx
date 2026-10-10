import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import RemoveIcon from '@mui/icons-material/Remove';
import { Alert, IconButton, Popover } from '@mui/material';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import type { HotelSearch } from '../../types/contracts';
import { Button } from '../common/ui';

function today() {
	const date = new Date();
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(
		2,
		'0',
	)}`;
}

export default function SearchBar({
	initialSearch,
	onSearch,
}: {
	initialSearch?: HotelSearch;
	onSearch?: (search: HotelSearch) => Promise<unknown>;
}) {
	const router = useRouter();
	const [destination, setDestination] = useState('');
	const [checkIn, setCheckIn] = useState('');
	const [checkOut, setCheckOut] = useState('');
	const [guests, setGuests] = useState(2);
	const [rooms, setRooms] = useState(1);
	const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
	const [error, setError] = useState('');
	const [pending, setPending] = useState(false);
	useEffect(() => {
		setDestination(initialSearch?.destination || '');
		setCheckIn(initialSearch?.checkIn || '');
		setCheckOut(initialSearch?.checkOut || '');
		setGuests(initialSearch?.guests || 2);
		setRooms(initialSearch?.rooms || 1);
	}, [initialSearch]);
	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (pending) return;
		// Native date controls may commit their change on blur. Read the submitted values directly.
		const fields = new FormData(event.currentTarget);
		const arrival = String(fields.get('checkIn') || '');
		const departure = String(fields.get('checkOut') || '');
		if (!!arrival !== !!departure) {
			setError('Choose both arrival and departure dates.');
			return;
		}
		if (arrival && (arrival < today() || departure <= arrival)) {
			setError('Choose a departure after your arrival.');
			return;
		}
		setError('');
		setPending(true);
		const search: HotelSearch = {
			...(destination.trim() ? { destination: destination.trim() } : {}),
			...(arrival ? { checkIn: arrival, checkOut: departure } : {}),
			guests,
			rooms,
		};
		try {
			if (onSearch) await onSearch(search);
			else await router.push({ pathname: '/property', query: { ...search } });
		} catch {
			setError('Could not open search. Please try again.');
		} finally {
			setPending(false);
		}
	};
	return (
		<>
			<form className="h-search" onSubmit={submit} aria-label="Search stays" aria-busy={pending}>
				<div className="h-search-destination">
					<label htmlFor="home-destination">Destination</label>
					<div>
						<LocationOnOutlinedIcon fontSize="small" />
						<input
							id="home-destination"
							placeholder="Seoul, Busan, or Tashkent"
							maxLength={100}
							value={destination}
							onChange={(event) => setDestination(event.target.value)}
						/>
					</div>
				</div>
				<fieldset className="h-search-dates">
					<legend>Stay dates</legend>
					<div>
						<CalendarMonthOutlinedIcon fontSize="small" />
						<input
							aria-label="Arrival"
							name="checkIn"
							type="date"
							min={today()}
							value={checkIn}
							onInput={(event) => setCheckIn(event.currentTarget.value)}
							onChange={(event) => {
								setCheckIn(event.target.value);
								if (checkOut && event.target.value >= checkOut) setCheckOut('');
							}}
						/>
						<span aria-hidden="true">—</span>
						<input
							aria-label="Departure"
							name="checkOut"
							type="date"
							min={checkIn || today()}
							value={checkOut}
							onInput={(event) => setCheckOut(event.currentTarget.value)}
							onChange={(event) => setCheckOut(event.target.value)}
						/>
					</div>
				</fieldset>
				<div className="h-search-occupancy">
					<span>Occupancy</span>
					<button
						type="button"
						onClick={(event) => setAnchor(event.currentTarget)}
						aria-expanded={!!anchor}
						aria-controls={anchor ? 'home-occupancy' : undefined}
						aria-haspopup="dialog"
					>
						<PeopleOutlineIcon fontSize="small" />
						{guests} {guests === 1 ? 'Guest' : 'Guests'}, {rooms} {rooms === 1 ? 'Room' : 'Rooms'}
					</button>
				</div>
				<Button
					className="h-search-submit"
					color="secondary"
					type="submit"
					disabled={pending}
					endIcon={<ArrowForwardIcon />}
				>
					{pending ? 'Opening…' : 'Search stays'}
				</Button>
			</form>
			<Popover
				id="home-occupancy"
				open={!!anchor}
				anchorEl={anchor}
				onClose={() => setAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
			>
				<div className="h-occupancy-popover" role="dialog" aria-label="Guests and rooms">
					{[
						{ label: 'Guests', value: guests, set: setGuests },
						{ label: 'Rooms', value: rooms, set: setRooms },
					].map(({ label, value, set }) => (
						<div className="h-stepper" key={label}>
							<span>{label}</span>
							<div>
								<IconButton
									aria-label={`Fewer ${label.toLowerCase()}`}
									disabled={value <= 1}
									onClick={() => set(value - 1)}
								>
									<RemoveIcon fontSize="small" />
								</IconButton>
								<output aria-live="polite">{value}</output>
								<IconButton aria-label={`More ${label.toLowerCase()}`} onClick={() => set(value + 1)}>
									<AddIcon fontSize="small" />
								</IconButton>
							</div>
						</div>
					))}
					<Button fullWidth variant="outlined" onClick={() => setAnchor(null)}>
						Done
					</Button>
				</div>
			</Popover>
			{error && (
				<Alert severity="error" className="h-search-error">
					{error}
				</Alert>
			)}
		</>
	);
}
