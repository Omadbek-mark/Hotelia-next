import { hotelLocalToday } from '../booking/room-selection';
import { SearchQuery } from '../search/hotel-search';
import { isMemberId, socialPage } from '../social/query';
import { Booking, HotelInput, RoomInput } from '../types/contracts';
import { BedType, BookingStatus, HotelAmenity, HotelType, RoomAmenity, RoomType } from '../enums';
export const label = (value: string) =>
	value
		.toLowerCase()
		.replace(/_/g, ' ')
		.replace(/^\w/, (c) => c.toUpperCase());
function text(value: unknown, min: number, max: number, name: string) {
	const s = typeof value === 'string' ? value.trim() : '';
	if (s.length < min || s.length > max) throw new Error(`${name}: use ${min}–${max} characters.`);
	return s;
}
function enumValue<T extends string>(value: unknown, values: T[], name: string): T {
	if (!values.includes(value as T)) throw new Error(`Choose a valid ${name}.`);
	return value as T;
}
function images(values: unknown) {
	if (
		!Array.isArray(values) ||
		!values.length ||
		values.length > 20 ||
		values.some((v) => typeof v !== 'string' || !v.trim() || v.length > 2048) ||
		new Set(values).size !== values.length
	)
		throw new Error('Add 1–20 different photos.');
	return values as string[];
}
function amenities<T extends string>(values: unknown, allowed: T[]): T[] {
	if (
		!Array.isArray(values) ||
		values.length > allowed.length ||
		new Set(values).size !== values.length ||
		values.some((v) => !allowed.includes(v))
	)
		throw new Error('Choose valid amenities.');
	return values as T[];
}
export function hotelInput(value: HotelInput): HotelInput {
	const hotelTimezone = value.hotelTimezone.trim();
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: hotelTimezone }).format();
	} catch {
		throw new Error('Enter a valid timezone, such as Asia/Seoul.');
	}
	return {
		hotelName: text(value.hotelName, 3, 100, 'Hotel name'),
		hotelDescription: text(value.hotelDescription, 10, 5000, 'Description'),
		hotelCountry: text(value.hotelCountry, 2, 100, 'Country'),
		hotelCity: text(value.hotelCity, 2, 100, 'City'),
		hotelAddress: text(value.hotelAddress, 3, 300, 'Street address'),
		hotelTimezone,
		hotelType: enumValue(value.hotelType, Object.values(HotelType), 'hotel type'),
		hotelImages: images(value.hotelImages),
		hotelAmenities: amenities(value.hotelAmenities, Object.values(HotelAmenity)),
	};
}
export function roomInput(value: RoomInput): RoomInput {
	if (!isMemberId(value.hotelId)) throw new Error('Choose a hotel.');
	for (const [name, n] of [
		['Guest limit', value.roomCapacity],
		['Units', value.roomQuantity],
	] as const)
		if (!Number.isInteger(n) || n < 1 || n > 2147483647) throw new Error(`${name} must be a positive whole number.`);
	if (
		!Number.isFinite(value.roomPrice) ||
		value.roomPrice < 0.01 ||
		value.roomPrice > Number.MAX_SAFE_INTEGER / 100 ||
		!/^\d+(?:\.\d{1,2})?$/.test(String(value.roomPrice))
	)
		throw new Error('Use a positive nightly price with up to two decimals.');
	if (!Number.isFinite(value.roomSize) || value.roomSize < 0.01) throw new Error('Enter a positive room size.');
	return {
		hotelId: value.hotelId,
		roomName: text(value.roomName, 3, 100, 'Room name'),
		roomDescription: text(value.roomDescription, 10, 5000, 'Description'),
		roomType: enumValue(value.roomType, Object.values(RoomType), 'room type'),
		bedType: enumValue(value.bedType, Object.values(BedType), 'bed type'),
		roomPrice: value.roomPrice,
		roomCapacity: value.roomCapacity,
		roomQuantity: value.roomQuantity,
		roomSize: value.roomSize,
		roomImages: images(value.roomImages),
		roomAmenities: amenities(value.roomAmenities, Object.values(RoomAmenity)),
	};
}
export function ownerFilters(query: SearchQuery, kind: 'hotels' | 'rooms' | 'bookings') {
	const page = socialPage(query.page),
		status = query.status,
		hotelId = query.hotelId;
	let error = !page ? 'Choose a valid page.' : undefined;
	const allowed = kind === 'bookings' ? Object.values(BookingStatus) : ['ACTIVE', 'PAUSED'];
	if (status !== undefined && (typeof status !== 'string' || !allowed.includes(status as BookingStatus)))
		error = 'Choose a valid status.';
	if (hotelId !== undefined && !isMemberId(hotelId)) error = 'Choose a valid hotel.';
	const checkIn = query.checkIn,
		checkOut = query.checkOut;
	if (checkIn !== undefined || checkOut !== undefined) {
		const valid = (v: unknown): v is string =>
			typeof v === 'string' &&
			/^\d{4}-\d{2}-\d{2}$/.test(v) &&
			Number.isFinite(Date.parse(v)) &&
			new Date(v).toISOString().slice(0, 10) === v;
		if (
			!valid(checkIn) ||
			!valid(checkOut) ||
			checkOut <= checkIn ||
			(Date.parse(checkOut) - Date.parse(checkIn)) / 86400000 > 365
		)
			error = 'Choose a valid arrival and departure range (1–365 nights).';
	}
	return {
		page: page || 1,
		status: typeof status === 'string' ? status : undefined,
		hotelId: typeof hotelId === 'string' ? hotelId : undefined,
		checkIn: typeof checkIn === 'string' ? checkIn : undefined,
		checkOut: typeof checkOut === 'string' ? checkOut : undefined,
		error,
	};
}
export function reservationActions(booking: Booking, now = new Date()) {
	let today: string;
	try {
		today = hotelLocalToday(booking.hotelData?.hotelTimezone || '', now);
	} catch {
		return {
			confirm: false,
			complete: false,
			cancel: [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.bookingStatus),
		};
	}
	return {
		confirm: booking.bookingStatus === BookingStatus.PENDING && booking.checkIn.slice(0, 10) >= today,
		complete: booking.bookingStatus === BookingStatus.CONFIRMED && booking.checkOut.slice(0, 10) <= today,
		cancel: [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.bookingStatus),
	};
}
export function ownerError(error: unknown) {
	const message = (error as Error)?.message || '';
	return /active bookings/i.test(message)
		? 'Existing reservations prevent this inventory change. Keep their capacity available.'
		: /expired|Only.*booking/i.test(message)
		? 'This reservation has changed or the action is unavailable. Refresh to see its current status.'
		: 'The change could not be confirmed. Refresh your workspace before trying again.';
}
