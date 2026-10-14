const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
	ts = require('typescript');
require.extensions['.ts'] = (m, f) =>
	m._compile(
		ts.transpileModule(fs.readFileSync(f, 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
		}).outputText,
		f,
	);
const {
	BookingRequester,
	canCancelTrip,
	canReviewTrip,
	parseTripsQuery,
	findBookingReview,
} = require('../../libs/booking/booking-request.ts');
const uuid1 = '00000000-0000-4000-8000-000000000001',
	uuid2 = '00000000-0000-4000-8000-000000000002';
const details = { roomId: 'a'.repeat(24), checkIn: '2026-11-01', checkOut: '2026-11-04', guests: 3, rooms: 2 };
const storage = () => {
	const map = new Map();
	return { getItem: (k) => map.get(k) || null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) };
};
test('concurrent submit shares one operation and sends only server-supported input', async () => {
	const requester = new BookingRequester(storage(), () => uuid1);
	let calls = 0,
		input,
		finish;
	const send = (value) => {
		calls++;
		input = value;
		return new Promise((resolve) => (finish = resolve));
	};
	const first = requester.request('member', details, send),
		second = requester.request('member', details, send);
	assert.equal(first, second);
	await Promise.resolve();
	assert.equal(calls, 1);
	assert.deepEqual(input, { ...details, requestId: uuid1, paymentMethod: 'CEO_BANK_ACCOUNT' });
	finish({ _id: 'booking', totalPrice: 750, bookingStatus: 'PENDING' });
	assert.equal((await first).totalPrice, 750);
});
test('lost response and reload retry reuse UUID; successful response finishes attempt', async () => {
	const store = storage(),
		first = new BookingRequester(store, () => uuid1);
	let original;
	await assert.rejects(
		first.request('member', details, (input) => {
			original = input;
			return Promise.reject(Error('lost response'));
		}),
	);
	const reloaded = new BookingRequester(store, () => uuid2);
	let retry;
	await reloaded.request('member', details, async (input) => {
		retry = input;
		return { _id: 'same-booking' };
	});
	assert.equal(retry.requestId, original.requestId);
	await reloaded.request('member', details, async (input) => {
		assert.equal(input.requestId, uuid2);
		return { _id: 'new-intent' };
	});
});
test('different members and changed stay details never reuse an ambiguous request', async () => {
	const store = storage();
	let sequence = 0;
	const requester = new BookingRequester(store, () => (++sequence === 1 ? uuid1 : uuid2));
	await assert.rejects(requester.request('first', details, () => Promise.reject(Error('network'))));
	await requester.request('second', details, async (input) => {
		assert.equal(input.requestId, uuid2);
		return { _id: 'second' };
	});
	await requester.request('first', { ...details, guests: 4 }, async (input) => {
		assert.equal(input.requestId, uuid2);
		return { _id: 'changed' };
	});
});
test('trip actions follow ownership and backend status rules', () => {
	for (const status of ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']) {
		const booking = { memberId: 'me', bookingStatus: status };
		assert.equal(canCancelTrip(booking, 'me'), ['PENDING', 'CONFIRMED'].includes(status));
		assert.equal(canReviewTrip(booking, 'me'), status === 'COMPLETED');
		assert.equal(canCancelTrip(booking, 'other'), false);
		assert.equal(canReviewTrip(booking, 'other'), false);
	}
});
test('trip URL filters reject malformed pagination and statuses', () => {
	for (const query of [{ tripPage: '0' }, { tripPage: '1.5' }, { tripPage: ['1', '2'] }, { bookingStatus: 'EXPIRED' }])
		assert.ok(parseTripsQuery(query).error);
	assert.deepEqual(parseTripsQuery({ tripPage: '2', bookingStatus: 'COMPLETED' }).input, {
		page: 2,
		limit: 5,
		bookingStatus: 'COMPLETED',
	});
});
test('existing review lookup checks later pages and fails closed on network errors', async () => {
	const pages = [];
	const review = await findBookingReview('target', async (page) => {
		pages.push(page);
		return { list: page === 1 ? [{ bookingId: 'other' }] : [{ bookingId: 'target', rating: 5 }], total: 101 };
	});
	assert.equal(review.rating, 5);
	assert.deepEqual(pages, [1, 2]);
	assert.equal(await findBookingReview('absent', async () => ({ list: [], total: 0 })), undefined);
	await assert.rejects(
		findBookingReview('target', async () => {
			throw Error('offline');
		}),
	);
});
