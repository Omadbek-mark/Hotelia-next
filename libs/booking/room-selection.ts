import { RoomSort, RoomStatus } from '../types/hotelia/enums';
import type { AvailableRoom, AvailableRoomsInquiry, RoomsInquiry, StayInput } from '../types/hotelia/contracts';
import { parseHotelSearch, SearchQuery } from '../search/hotel-search';

export function hotelLocalToday(timezone: string, now = new Date()): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(now);
	const value = (type: string) => parts.find((part) => part.type === type)!.value;
	return `${value('year')}-${value('month')}-${value('day')}`;
}

export function parseRoomSelection(query: SearchQuery, timezone?: string, now = new Date()) {
	const parsed = parseHotelSearch({
		checkIn: query.checkIn,
		checkOut: query.checkOut,
		guests: query.guests,
		rooms: query.rooms,
		roomType: query.roomType,
		page: query.roomPage,
	});
	const hotelId = typeof query.id === 'string' && /^[a-f\d]{24}$/i.test(query.id) ? query.id : '';
	const rawSort = query.roomSort;
	const sort =
		typeof rawSort === 'string' && Object.values(RoomSort).includes(rawSort as RoomSort)
			? (rawSort as RoomSort)
			: RoomSort.PRICE_ASC;
	const search = parsed.input.search || {};
	const roomInput: RoomsInquiry = {
		hotelId,
		page: parsed.input.page || 1,
		limit: 6,
		sort,
		...(search.roomType ? { roomType: search.roomType } : {}),
	};
	let error = !hotelId ? 'Choose a valid hotel.' : parsed.error;
	if (rawSort !== undefined && (typeof rawSort !== 'string' || !Object.values(RoomSort).includes(rawSort as RoomSort)))
		error = 'Choose a valid room order.';
	const stay: StayInput | undefined =
		search.checkIn && search.checkOut
			? { checkIn: search.checkIn, checkOut: search.checkOut, guests: search.guests || 2, rooms: search.rooms || 1 }
			: undefined;
	if (!error && stay && timezone && stay.checkIn < hotelLocalToday(timezone, now))
		error = 'Choose an arrival from today in the hotel’s local time.';
	const availableInput: AvailableRoomsInquiry | undefined = stay ? { ...roomInput, ...stay } : undefined;
	return {
		hotelId,
		roomInput,
		availableInput,
		stay,
		error,
		nights: stay && !error ? (Date.parse(stay.checkOut) - Date.parse(stay.checkIn)) / 86400000 : 0,
	};
}

export function canSelectRoom(room: AvailableRoom, stay: StayInput): boolean {
	const rooms = stay.rooms || 1;
	return (
		room.roomStatus === RoomStatus.ACTIVE &&
		room.availableQuantity >= rooms &&
		room.roomCapacity >= Math.ceil(stay.guests / rooms)
	);
}

/** Display-only estimate. Booking totals remain authoritative server values. */
export function estimateStay(price: number, nights: number, rooms: number): number | undefined {
	const cents = Math.round(price * 100) * nights * rooms;
	return Number.isFinite(price) &&
		price >= 0 &&
		Number.isInteger(nights) &&
		nights >= 1 &&
		nights <= 365 &&
		Number.isInteger(rooms) &&
		rooms >= 1 &&
		Number.isSafeInteger(cents)
		? cents / 100
		: undefined;
}
