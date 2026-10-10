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
const { parseHotelSearch, hotelSearchQuery } = require('../../libs/search/hotel-search.ts');
test('unfiltered discovery omits occupancy and availability restrictions', () => {
	assert.deepEqual(parseHotelSearch({}).input, { page: 1, limit: 9, sort: 'NEWEST', search: {} });
});
test('malformed URL inputs never reach the API', () => {
	for (const query of [
		{ page: '0' },
		{ limit: '101' },
		{ guests: '1.5' },
		{ rooms: 'NaN' },
		{ sort: 'price' },
		{ hotelType: 'VILLA' },
		{ roomType: 'INVALID' },
		{ amenities: 'UNKNOWN' },
		{ minPrice: '-1' },
		{ maxPrice: '1.001' },
		{ minPrice: '40', maxPrice: '30' },
		{ minRating: '5.1' },
		{ destination: 'a'.repeat(101) },
		{ ownerId: 'bad' },
		{ destination: ['Seoul', 'Busan'] },
	])
		assert.ok(parseHotelSearch(query).error, JSON.stringify(query));
});
test('partial, impossible, reversed and excessive stay dates are rejected', () => {
	for (const query of [
		{ checkIn: '2026-10-10' },
		{ checkIn: '2026-02-30', checkOut: '2026-03-03' },
		{ checkIn: '2026-10-10', checkOut: '2026-10-10' },
		{ checkIn: '2026-10-10', checkOut: '2026-10-09' },
		{ checkIn: '2026-10-10', checkOut: '2027-10-11' },
		{ checkIn: 'not-a-date', checkOut: 'x' },
	])
		assert.ok(parseHotelSearch(query).error);
	assert.equal(parseHotelSearch({ checkIn: '2028-02-29', checkOut: '2028-03-01' }).error, undefined);
});
test('filter URL round trip preserves zero budget, enums and stay selection', () => {
	const query = {
		destination: 'Seoul',
		checkIn: '2026-11-01',
		checkOut: '2026-11-04',
		guests: '3',
		rooms: '2',
		minPrice: '0',
		maxPrice: '125.50',
		minRating: '4.5',
		hotelType: 'HOTEL',
		roomType: 'DOUBLE',
		amenities: 'WIFI,POOL',
		sort: 'PRICE_ASC',
		page: '2',
		limit: '1',
	};
	const parsed = parseHotelSearch(query);
	assert.equal(parsed.error, undefined);
	assert.deepEqual(parseHotelSearch(hotelSearchQuery(parsed.input)).input, parsed.input);
});
test('pagination and sorting preserve filters; changed filters reset page explicitly', () => {
	const input = parseHotelSearch({ destination: 'Busan', amenities: 'WIFI', page: '2', limit: '1' }).input;
	assert.equal(hotelSearchQuery({ ...input, page: 3 }).destination, 'Busan');
	const sorted = parseHotelSearch(hotelSearchQuery({ ...input, page: 1, sort: 'RATING' })).input;
	assert.deepEqual(sorted.search, input.search);
	assert.equal(sorted.page, 1);
	assert.equal(sorted.sort, 'RATING');
});
