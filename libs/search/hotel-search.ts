import type { HotelSearch, HotelsInquiry } from '../types/contracts';
import { HotelAmenity, HotelSort, HotelType, RoomType } from '../enums';

export type SearchQuery = Record<string, string | string[] | undefined>;
export const searchLabels: Record<string, string> = {
	WIFI: 'Wi-Fi',
	POOL: 'Pool',
	PARKING: 'Parking',
	BREAKFAST: 'Breakfast',
	GYM: 'Gym',
	SPA: 'Spa',
	AIR_CONDITIONING: 'Air conditioning',
	RESTAURANT: 'Restaurant',
	HOTEL: 'Hotel',
	RESORT: 'Resort',
	HOSTEL: 'Hostel',
	APARTMENT: 'Apartment',
	GUEST_HOUSE: 'Guest house',
	SINGLE: 'Single',
	DOUBLE: 'Double',
	TWIN: 'Twin',
	DELUXE: 'Deluxe',
	SUITE: 'Suite',
	FAMILY: 'Family',
};
export const sortLabels: Record<HotelSort, string> = {
	NEWEST: 'Newest stays',
	PRICE_ASC: 'Price: low to high',
	PRICE_DESC: 'Price: high to low',
	RATING: 'Top rated',
	MOST_POPULAR: 'Most popular',
	MOST_LIKED: 'Most saved',
};
const validDate = (value: string) =>
	/^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().slice(0, 10) === value;

/** URL input is untrusted. Reject malformed filters before sending a GraphQL request. */
export function parseHotelSearch(query: SearchQuery): { input: HotelsInquiry; error?: string } {
	const search: HotelSearch = {};
	const input: HotelsInquiry = { page: 1, limit: 9, sort: HotelSort.NEWEST, search };
	try {
		const read = (key: string) => {
			const raw = query[key];
			if (Array.isArray(raw)) {
				if (key === 'amenities') return raw.join(',');
				throw Error(`Choose one ${key}.`);
			}
			return raw?.trim() || '';
		};
		for (const key of ['page', 'limit', 'guests', 'rooms'] as const) {
			const raw = read(key);
			if (!raw) continue;
			const value = Number(raw),
				max = key === 'page' ? 1000000 : key === 'limit' ? 100 : 2147483647;
			if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < 1 || value > max)
				throw Error(`Choose a valid ${key}.`);
			if (key === 'page' || key === 'limit') input[key] = value;
			else search[key] = value;
		}
		const enumValue = (key: string, values: string[]) => {
			const value = read(key);
			if (value && !values.includes(value)) throw Error(`Choose a valid ${key}.`);
			return value;
		};
		input.sort = (enumValue('sort', Object.values(HotelSort)) || HotelSort.NEWEST) as HotelSort;
		const hotelType = enumValue('hotelType', Object.values(HotelType));
		if (hotelType) search.hotelType = hotelType as HotelType;
		const roomType = enumValue('roomType', Object.values(RoomType));
		if (roomType) search.roomType = roomType as RoomType;
		for (const key of ['destination', 'text'] as const) {
			const value = read(key);
			if (value.length > 100) throw Error('Keep your search under 100 characters.');
			if (value) search[key] = value;
		}
		const ownerId = read('ownerId');
		if (ownerId) {
			if (!/^[a-f\d]{24}$/i.test(ownerId)) throw Error('Choose a valid host.');
			search.ownerId = ownerId;
		}
		for (const key of ['minPrice', 'maxPrice', 'minRating'] as const) {
			const raw = read(key);
			if (!raw) continue;
			const value = Number(raw);
			if (
				!/^\d+(\.\d{1,2})?$/.test(raw) ||
				!Number.isFinite(value) ||
				value < 0 ||
				value > (key === 'minRating' ? 5 : Number.MAX_SAFE_INTEGER / 100)
			)
				throw Error(`Choose a valid ${key === 'minRating' ? 'rating' : 'price'}.`);
			search[key] = value;
		}
		if (search.minPrice !== undefined && search.maxPrice !== undefined && search.minPrice > search.maxPrice)
			throw Error('Maximum price must be at least the minimum.');
		const checkIn = read('checkIn'),
			checkOut = read('checkOut');
		if (!!checkIn !== !!checkOut) throw Error('Choose both arrival and departure dates.');
		if (checkIn) {
			if (!validDate(checkIn) || !validDate(checkOut)) throw Error('Choose valid stay dates.');
			const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / 86400000;
			if (nights < 1 || nights > 365) throw Error('Choose a stay between 1 and 365 nights.');
			search.checkIn = checkIn;
			search.checkOut = checkOut;
		}
		const amenities = read('amenities');
		if (amenities) {
			const values = Array.from(new Set(amenities.split(',')));
			if (values.some((value) => !Object.values(HotelAmenity).includes(value as HotelAmenity)))
				throw Error('Choose valid amenities.');
			search.amenities = values as HotelAmenity[];
		}
		return { input };
	} catch (error) {
		return { input, error: error instanceof Error ? error.message : 'Check your search filters.' };
	}
}

export function hotelSearchQuery(input: HotelsInquiry): Record<string, string> {
	const query: Record<string, string> = {};
	if (input.page && input.page !== 1) query.page = String(input.page);
	if (input.limit && input.limit !== 9) query.limit = String(input.limit);
	if (input.sort && input.sort !== HotelSort.NEWEST) query.sort = input.sort;
	Object.entries(input.search || {}).forEach(([key, value]) => {
		if (value !== undefined && value !== '' && (!Array.isArray(value) || value.length))
			query[key] = Array.isArray(value) ? value.join(',') : String(value);
	});
	return query;
}
