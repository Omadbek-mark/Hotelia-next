import type { Booking, BookingInput, Comment, StayInput } from '../types/hotelia/contracts';
import { BookingStatus } from '../types/hotelia/enums';
import type { SearchQuery } from '../search/hotel-search';

export type RequestDetails = StayInput & { roomId: string };
type AttemptStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Keep the same UUID across ambiguous network retries, including reloads. */
export class BookingRequester {
	private inFlight = new Map<string, Promise<Booking>>();
	private ids = new Map<string, string>();
	constructor(private storage?: AttemptStorage, private uuid = () => crypto.randomUUID()) {}
	request(
		memberId: string,
		details: RequestDetails,
		send: (input: BookingInput) => Promise<Booking>,
	): Promise<Booking> {
		const canonical = {
			roomId: details.roomId.toLowerCase(),
			checkIn: details.checkIn,
			checkOut: details.checkOut,
			guests: details.guests,
			rooms: details.rooms || 1,
		};
		const key = `hotelia:booking:${memberId}:${JSON.stringify(canonical)}`;
		const pending = this.inFlight.get(key);
		if (pending) return pending;
		let requestId = this.ids.get(key);
		if (!requestId) {
			try {
				requestId = this.storage?.getItem(key) || undefined;
			} catch {}
		}
		if (!requestId || !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(requestId))
			requestId = this.uuid();
		this.ids.set(key, requestId);
		try {
			this.storage?.setItem(key, requestId);
		} catch {
			/* In-memory retries remain safe when storage is unavailable. */
		}
		const operation = Promise.resolve()
			.then(() => send({ ...canonical, requestId: requestId! }))
			.then((booking) => {
				this.ids.delete(key);
				try {
					this.storage?.removeItem(key);
				} catch {}
				return booking;
			})
			.finally(() => {
				this.inFlight.delete(key);
			});
		this.inFlight.set(key, operation);
		return operation;
	}
}
let requester: BookingRequester | undefined;
export function bookingRequester(): BookingRequester {
	if (!requester) {
		let storage: Storage | undefined;
		try {
			if (typeof window !== 'undefined') storage = window.sessionStorage;
		} catch {}
		requester = new BookingRequester(storage);
	}
	return requester;
}
export function canCancelTrip(booking: Booking, memberId: string) {
	return (
		booking.memberId === memberId && [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.bookingStatus)
	);
}
export function canReviewTrip(booking: Booking, memberId: string) {
	return booking.memberId === memberId && booking.bookingStatus === BookingStatus.COMPLETED;
}
export const tripDate = (date: string) => date.slice(0, 10);
export function parseTripsQuery(query: SearchQuery) {
	const input: { page: number; limit: number; bookingStatus?: BookingStatus } = { page: 1, limit: 5 };
	if (query.tripPage !== undefined) {
		const raw = query.tripPage;
		const value = typeof raw === 'string' ? Number(raw) : NaN;
		if (!Number.isInteger(value) || value < 1 || value > 1000000 || !/^\d+$/.test(String(raw)))
			return { input, error: 'Choose a valid trip page.' };
		input.page = value;
	}
	if (query.bookingStatus !== undefined && query.bookingStatus !== '') {
		if (
			typeof query.bookingStatus !== 'string' ||
			!Object.values(BookingStatus).includes(query.bookingStatus as BookingStatus)
		)
			return { input, error: 'Choose a valid trip status.' };
		input.bookingStatus = query.bookingStatus as BookingStatus;
	}
	return { input };
}
export async function findBookingReview(
	bookingId: string,
	fetchPage: (page: number) => Promise<{ list: Comment[]; total: number }>,
): Promise<Comment | undefined> {
	for (let page = 1; page <= 1000000; page++) {
		const result = await fetchPage(page),
			review = result.list.find((item) => item.bookingId === bookingId);
		if (review) return review;
		if (!result.list.length || page * 100 >= result.total) return undefined;
	}
	throw Error('Reviews could not be checked. Please try again.');
}
export function bookingError(error: unknown): string {
	const message = error instanceof Error ? error.message : '';
	if (/available rooms|guest capacity/i.test(message))
		return 'This room is no longer available for your stay. Refresh availability and choose again.';
	if (/already has a review/i.test(message)) return 'A review has already been submitted for this stay.';
	if (/only pending or confirmed/i.test(message))
		return 'This trip’s status changed. Refresh your trips to see the latest status.';
	if (/unauthenticated|unauthorized|authentication|token/i.test(message)) return 'Please sign in again, then retry.';
	return 'The request could not be confirmed. Try again or check My Trips.';
}
