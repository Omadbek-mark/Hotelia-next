const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) =>
	module._compile(
		ts.transpileModule(fs.readFileSync(file, 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
		}).outputText,
		file,
	);
const {
	parseRoomSelection,
	hotelLocalToday,
	canSelectRoom,
	estimateStay,
} = require('../../libs/booking/room-selection.ts');
const hotelId = 'a'.repeat(24);
test('without dates, only inventory inquiry is created', () => {
	const result = parseRoomSelection({ hotelId });
	assert.equal(result.error, undefined);
	assert.equal(result.availableInput, undefined);
	assert.deepEqual(result.roomInput, { hotelId, page: 1, limit: 6, sort: 'PRICE_ASC' });
});
test('stay inquiry receives capacity, quantity and room filter', () => {
	const result = parseRoomSelection(
		{
			hotelId,
			checkIn: '2026-11-01',
			checkOut: '2026-11-04',
			guests: '5',
			rooms: '2',
			roomType: 'FAMILY',
			roomSort: 'PRICE_DESC',
			roomPage: '2',
		},
		'Asia/Seoul',
		new Date('2026-10-09'),
	);
	assert.equal(result.error, undefined);
	assert.equal(result.nights, 3);
	assert.deepEqual(result.availableInput, {
		hotelId: hotelId,
		page: 2,
		limit: 6,
		sort: 'PRICE_DESC',
		roomType: 'FAMILY',
		checkIn: '2026-11-01',
		checkOut: '2026-11-04',
		guests: 5,
		rooms: 2,
	});
});
test('invalid hotel IDs, dates, occupancy and room ordering are rejected', () => {
	for (const query of [
		{ hotelId: 'bad' },
		{ hotelId: [hotelId, hotelId] },
		{ hotelId, checkIn: '2026-11-01' },
		{ hotelId, guests: '0' },
		{ hotelId, rooms: '-1' },
		{ hotelId, roomPage: '0' },
		{ hotelId, roomSort: 'RATING' },
		{ hotelId, roomType: 'VILLA' },
	])
		assert.ok(parseRoomSelection(query).error, JSON.stringify(query));
});
test('arrival uses the hotel timezone rather than the browser date', () => {
	const now = new Date('2026-10-09T18:00:00Z');
	assert.equal(hotelLocalToday('Asia/Seoul', now), '2026-10-10');
	assert.equal(hotelLocalToday('America/Los_Angeles', now), '2026-10-09');
	const query = { hotelId, checkIn: '2026-10-09', checkOut: '2026-10-11' };
	assert.ok(parseRoomSelection(query, 'Asia/Seoul', now).error);
	assert.equal(parseRoomSelection(query, 'America/Los_Angeles', now).error, undefined);
});
test('selection requires active room, enough nightly stock and per-room capacity', () => {
	const stay = { checkIn: '2026-11-01', checkOut: '2026-11-04', guests: 5, rooms: 2 };
	const room = { roomStatus: 'ACTIVE', availableQuantity: 2, roomCapacity: 3 };
	assert.equal(canSelectRoom(room, stay), true);
	assert.equal(canSelectRoom({ ...room, availableQuantity: 1 }, stay), false);
	assert.equal(canSelectRoom({ ...room, roomCapacity: 2 }, stay), false);
	assert.equal(canSelectRoom({ ...room, roomStatus: 'PAUSED' }, stay), false);
});
test('estimate accounts for nights and rooms with decimal-safe currency arithmetic', () => {
	assert.equal(estimateStay(99.99, 3, 2), 599.94);
	assert.equal(estimateStay(0, 3, 1), 0);
	for (const values of [
		[Infinity, 3, 1],
		[-1, 3, 1],
		[100, 0, 1],
		[100, 366, 1],
		[100, 3, 0],
		[Number.MAX_SAFE_INTEGER, 365, 2147483647],
	])
		assert.equal(estimateStay(...values), undefined);
});
