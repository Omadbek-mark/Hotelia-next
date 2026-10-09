const { test, afterEach } = require('node:test'),
	assert = require('node:assert/strict');
const { JSDOM } = require('jsdom'),
	fs = require('node:fs'),
	ts = require('typescript');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:3015' });
Object.assign(global, {
	window: dom.window,
	self: dom.window,
	document: dom.window.document,
	HTMLElement: dom.window.HTMLElement,
	DocumentFragment: dom.window.DocumentFragment,
	Node: dom.window.Node,
	MutationObserver: dom.window.MutationObserver,
	getComputedStyle: dom.window.getComputedStyle,
	IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
for (const extension of ['.ts', '.tsx'])
	require.extensions[extension] = (m, f) =>
		m._compile(
			ts.transpileModule(fs.readFileSync(f, 'utf8'), {
				compilerOptions: {
					module: ts.ModuleKind.CommonJS,
					target: ts.ScriptTarget.ES2019,
					jsx: ts.JsxEmit.ReactJSX,
					esModuleInterop: true,
				},
			}).outputText,
			f,
		);
const React = require('react'),
	{ createRoot } = require('react-dom/client'),
	{ act } = require('react-dom/test-utils');
const { ApolloClient, ApolloLink, ApolloProvider, InMemoryCache, Observable } = require('@apollo/client');
const { RouterContext } = require('next/dist/shared/lib/router-context.shared-runtime');
const { ThemeProvider } = require('@mui/material'),
	{ hoteliaTheme } = require('../../libs/components/hotelia/theme.ts');
const { userVar, anonymousUser } = require('../../apollo/store.ts');
const BookingDialog = require('../../libs/components/hotelia/BookingRequestDialog.tsx').default;
const MyTrips = require('../../libs/components/hotelia/MyTrips.tsx').default;
const MemberProfile = require('../../libs/components/hotelia/MemberProfile.tsx').default;
const Connections = require('../../libs/components/hotelia/Connections.tsx').default;
const StayCollection = require('../../libs/components/hotelia/StayCollection.tsx').default;
const PublicLayout = require('../../libs/components/hotelia/PublicLayout.tsx').default;
const AccountLayout = require('../../libs/components/hotelia/AccountLayout.tsx').default;
const member = 'c'.repeat(24),
	hotelId = 'a'.repeat(24),
	roomId = 'b'.repeat(24);
const stay = { checkIn: '2027-11-01', checkOut: '2027-11-04', guests: 3, rooms: 2 };
const hotel = {
	_id: hotelId,
	hotelName: 'Test courtyard',
	hotelCity: 'Seoul',
	hotelCountry: 'South Korea',
	hotelTimezone: 'Asia/Seoul',
};
const room = {
	_id: roomId,
	hotelId,
	roomName: 'Garden suite',
	roomPrice: 99.99,
	roomStatus: 'ACTIVE',
	roomCapacity: 2,
	availableQuantity: 3,
};
const base = {
	__typename: 'Booking',
	_id: 'd'.repeat(24),
	memberId: member,
	hotelId,
	roomId,
	checkIn: '2027-11-01T00:00:00.000Z',
	checkOut: '2027-11-04T00:00:00.000Z',
	guests: 3,
	rooms: 2,
	nights: 3,
	pricePerNight: 125,
	totalPrice: 750,
	currency: 'USD',
	bookingStatus: 'PENDING',
	expiresAt: null,
	createdAt: '2026-10-09T00:00:00.000Z',
	updatedAt: '2026-10-09T00:00:00.000Z',
};
const enriched = (value) => ({
	...value,
	hotelData: { __typename: 'BookingHotelData', ...hotel, hotelAddress: 'Courtyard street', hotelImages: [] },
	roomData: { __typename: 'BookingRoomData', _id: roomId, roomName: room.roomName, roomType: 'SUITE', roomImages: [] },
});
let root, client, host;
afterEach(async () => {
	if (root) await act(async () => root.unmount());
	client?.stop();
	host?.remove();
	userVar({ ...anonymousUser });
});
async function mount(
	component,
	handler,
	query = { category: 'myBookings' },
	push = async () => true,
	pathname = '/mypage',
) {
	userVar({ ...anonymousUser, _id: member, memberNick: 'Traveler', memberType: 'USER' });
	const operations = [];
	client = new ApolloClient({
		cache: new InMemoryCache(),
		link: new ApolloLink(
			(operation) =>
				new Observable((observer) => {
					operations.push(operation);
					Promise.resolve()
						.then(() => handler(operation))
						.then(
							(data) => {
								observer.next({ data });
								observer.complete();
							},
							(error) => observer.error(error),
						);
				}),
		),
	});
	host = document.createElement('div');
	document.body.appendChild(host);
	root = createRoot(host);
	const router = {
		isReady: true,
		query,
		pathname,
		asPath: pathname + '?' + new URLSearchParams(query),
		push,
		events: { on() {}, off() {} },
	};
	await act(async () => {
		root.render(
			React.createElement(
				RouterContext.Provider,
				{ value: router },
				React.createElement(
					ApolloProvider,
					{ client },
					React.createElement(ThemeProvider, { theme: hoteliaTheme }, component),
				),
			),
		);
		await new Promise((r) => setTimeout(r, 25));
	});
	return operations;
}
async function settle() {
	await act(async () => {
		await new Promise((r) => setTimeout(r, 25));
	});
}
function button(text) {
	const found = [...document.querySelectorAll('button')].find((element) => element.textContent.trim() === text);
	assert.ok(found, `Missing button: ${text}`);
	return found;
}
async function click(text) {
	await act(async () => button(text).click());
	await settle();
}

async function savePreview(name) {
	const directory = process.env.HOTELIA_PREVIEW_DIR;
	if (!directory) return;
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 300));
	});
	const root = document.body.cloneNode(true);
	root.querySelectorAll('img').forEach((element) => {
		const src = element.getAttribute('src');
		if (src?.startsWith('/')) element.setAttribute('src', 'http://localhost:3015' + src);
	});
	root.querySelectorAll('input,textarea').forEach((element, index) => {
		const source = document.body.querySelectorAll('input,textarea')[index];
		if (element.tagName === 'TEXTAREA') {
			element.textContent = source.value;
			// JSDOM cannot measure MUI's autosizing textarea. Give the static preview its three visible rows.
			if (element.getAttribute('aria-hidden') !== 'true') {
				element.style.height = 'auto';
				element.style.minHeight = '72px';
			}
		} else {
			element.setAttribute('value', source.value);
			if (source.checked) element.setAttribute('checked', '');
		}
	});
	const css = fs
		.readdirSync('.next/static/css')
		.filter((file) => file.endsWith('.css'))
		.map((file) => fs.readFileSync('.next/static/css/' + file, 'utf8'))
		.join('\n');
	const mui = Array.from(document.styleSheets)
		.map((sheet) =>
			Array.from(sheet.cssRules || [])
				.map((rule) => rule.cssText)
				.join('\n'),
		)
		.join('\n');
	fs.writeFileSync(
		directory + '/' + name + '.html',
		`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hotelia UI test preview</title><link href="https://fonts.googleapis.com/css2?family=Newsreader:wght@400;500;600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"><style>${css} ${mui} body{margin:0;background:#fcf9f4}.fixture-label{position:fixed;top:0;left:0;right:0;z-index:1600;padding:8px;background:#1a2e26;color:white;text-align:center;font:12px Arial}</style></head><body><div class="fixture-label">UI test preview · Sample data · No live records created</div>${root.innerHTML}</body></html>`,
	);
}

test('booking UI blocks double click and shows authoritative server total and status', async () => {
	let closed = 0;
	const operations = await mount(
		React.createElement(BookingDialog, {
			hotel,
			room,
			stay,
			open: true,
			onClose() {
				closed++;
			},
			onBooked() {},
		}),
		(operation) => {
			assert.equal(operation.operationName, 'RequestStay');
			return { createBooking: base };
		},
	);
	assert.match(document.body.textContent, /599\.94/);
	await savePreview('booking-dialog-ui-test');
	await act(async () => {
		const submit = button('Send booking request');
		submit.click();
		submit.click();
	});
	await settle();
	assert.equal(operations.length, 1);
	const input = operations[0].variables.input;
	assert.deepEqual(Object.keys(input).sort(), ['checkIn', 'checkOut', 'guests', 'requestId', 'roomId', 'rooms'].sort());
	assert.match(input.requestId, /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
	assert.match(document.body.textContent, /Request received/);
	assert.match(document.body.textContent, /PENDING/);
	assert.match(document.body.textContent, /750/);
	assert.doesNotMatch(document.body.textContent, /599\.94/);
	assert.equal(closed, 0);
	await savePreview('booking-receipt-ui-test');
});

test('trip cancellation reads current status and refreshes returned cancellation', async () => {
	let current = { ...base };
	const operations = await mount(React.createElement(MyTrips), (operation) => {
		if (operation.operationName === 'MyHotelTrips')
			return {
				getMyBookings: {
					__typename: 'Bookings',
					list: [enriched(current)],
					metaCounter: [{ __typename: 'TotalCounter', total: 1 }],
				},
			};
		if (operation.operationName === 'MyTripDetail') return { getBooking: enriched(current) };
		if (operation.operationName === 'CancelStay') {
			current = { ...current, bookingStatus: 'CANCELLED' };
			return { cancelBooking: current };
		}
		throw Error(operation.operationName);
	});
	await settle();
	await click('Cancel request');
	await click('Confirm cancellation');
	assert.equal(operations.filter((op) => op.operationName === 'CancelStay').length, 1);
	assert.match(document.body.textContent, /Your request was cancelled/);
	assert.match(document.body.textContent, /CANCELLED/);
	assert.ok(operations.filter((op) => op.operationName === 'MyHotelTrips').length >= 2);
});

test('completed trip publishes one trimmed review and prevents another submission', async () => {
	const completed = { ...base, bookingStatus: 'COMPLETED' };
	const operations = await mount(React.createElement(MyTrips), (operation) => {
		if (operation.operationName === 'MyHotelTrips')
			return {
				getMyBookings: {
					__typename: 'Bookings',
					list: [enriched(completed)],
					metaCounter: [{ __typename: 'TotalCounter', total: 1 }],
				},
			};
		if (operation.operationName === 'HotelGuestReviews')
			return {
				getComments: { __typename: 'Comments', list: [], metaCounter: [{ __typename: 'TotalCounter', total: 0 }] },
			};
		if (operation.operationName === 'ReviewCompletedStay')
			return {
				createComment: {
					__typename: 'Comment',
					_id: 'e'.repeat(24),
					bookingId: completed._id,
					commentRefId: hotelId,
					commentContent: operation.variables.input.commentContent,
					rating: operation.variables.input.rating,
				},
			};
		throw Error(operation.operationName);
	});
	await settle();
	assert.ok(![...document.querySelectorAll('button')].some((el) => el.textContent === 'Cancel request'));
	await click('Write review');
	await act(async () => {
		document.querySelector('input[value="5"]').click();
		const field = document.querySelector('textarea');
		Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, 'value').set.call(
			field,
			'  Quiet and comfortable.  ',
		);
		field.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
	});
	await savePreview('review-dialog-ui-test');
	await click('Publish review');
	const mutations = operations.filter((op) => op.operationName === 'ReviewCompletedStay');
	assert.equal(mutations.length, 1);
	assert.deepEqual(mutations[0].variables.input, {
		bookingId: completed._id,
		commentRefId: hotelId,
		commentGroup: 'HOTEL',
		rating: 5,
		commentContent: 'Quiet and comfortable.',
	});
	assert.match(document.body.textContent, /Your review is saved/);
	assert.match(document.body.textContent, /Reviewed/);
	assert.ok(![...document.querySelectorAll('button')].some((el) => el.textContent === 'Publish review'));
});

test('existing completed-stay review is read instead of offering another submission', async () => {
	const completed = { ...base, bookingStatus: 'COMPLETED' },
		saved = {
			__typename: 'Comment',
			_id: 'e'.repeat(24),
			bookingId: base._id,
			rating: 4,
			commentContent: 'Already shared.',
			createdAt: base.createdAt,
			memberData: null,
		};
	const operations = await mount(React.createElement(MyTrips), (operation) => {
		if (operation.operationName === 'MyHotelTrips')
			return {
				getMyBookings: {
					__typename: 'Bookings',
					list: [enriched(completed)],
					metaCounter: [{ __typename: 'TotalCounter', total: 1 }],
				},
			};
		if (operation.operationName === 'HotelGuestReviews')
			return {
				getComments: { __typename: 'Comments', list: [saved], metaCounter: [{ __typename: 'TotalCounter', total: 1 }] },
			};
		throw Error(operation.operationName);
	});
	await settle();
	await click('Write review');
	assert.match(document.body.textContent, /Already shared/);
	assert.match(document.body.textContent, /Reviewed/);
	assert.ok(![...document.querySelectorAll('button')].some((el) => el.textContent === 'Publish review'));
	assert.equal(operations.filter((op) => op.operationName === 'ReviewCompletedStay').length, 0);
});

const collectionHotels = ['Seoul Courtyard', 'Busan Ocean', 'Tashkent Garden'].map((name, index) => ({
	__typename: 'Hotel',
	_id: String(index + 1).repeat(24),
	hotelName: name,
	hotelCity: ['Seoul', 'Busan', 'Tashkent'][index],
	hotelCountry: index === 2 ? 'Uzbekistan' : 'South Korea',
	hotelImages: ['http://localhost:3021/uploads/hotel/e7526934-e627-42c5-b892-7adacc81f977.jpg'],
	hotelAmenities: ['WIFI', 'BREAKFAST'],
	hotelRating: 0,
	hotelReviews: 0,
	startingPrice: null,
	isFavorite: true,
}));
const collectionPage = (kind) =>
	React.createElement(
		PublicLayout,
		{},
		React.createElement(AccountLayout, {}, React.createElement(StayCollection, { kind })),
	);

test('saved stays remove once, refresh membership/count and retain other hotel cache fields', async () => {
	let removed = false;
	const operations = await mount(
		collectionPage('saved'),
		(operation) => {
			if (operation.operationName === 'SavedStays')
				return {
					getFavorites: {
						list: removed ? collectionHotels.slice(1) : collectionHotels,
						metaCounter: [{ total: removed ? 2 : 3 }],
					},
				};
			assert.equal(operation.operationName, 'UnsaveDetailHotel');
			removed = true;
			return { unfavoriteHotel: { hotelId: collectionHotels[0]._id, isFavorite: false, hotelLikes: 0 } };
		},
		{ category: 'myFavorites', collectionPage: '1' },
	);
	await settle();
	assert.match(document.body.textContent, /3 stays/);
	await savePreview('saved-stays-ui-test');
	await act(async () => {
		const action = document.querySelector('[aria-label="Unsave Seoul Courtyard"]');
		action.click();
		action.click();
	});
	await settle();
	assert.equal(operations.filter((op) => op.operationName === 'UnsaveDetailHotel').length, 1);
	assert.match(document.body.textContent, /2 stays/);
	assert.equal(document.querySelectorAll('.h-hotel-card').length, 2);
	const cached = client.cache.extract()['Hotel:' + collectionHotels[0]._id];
	assert.equal(cached.isFavorite, false);
	assert.equal(cached.hotelName, 'Seoul Courtyard');
});

test('recent views save a hotel without removing history and invalidate saved collection pages', async () => {
	const operations = await mount(
		collectionPage('viewed'),
		(operation) => {
			if (operation.operationName === 'ViewedStays')
				return {
					getVisited: {
						list: collectionHotels.map((hotel) => ({ ...hotel, isFavorite: false })),
						metaCounter: [{ total: 3 }],
					},
				};
			assert.equal(operation.operationName, 'SaveDetailHotel');
			return { favoriteHotel: { hotelId: collectionHotels[0]._id, isFavorite: true, hotelLikes: 1 } };
		},
		{ category: 'recentlyVisited' },
	);
	await settle();
	await savePreview('viewed-stays-ui-test');
	const { GET_SAVED_STAYS } = require('../../apollo/hotelia/collections.ts');
	client.cache.writeQuery({
		query: GET_SAVED_STAYS,
		variables: { input: { page: 2, limit: 6 } },
		data: { getFavorites: { list: [], metaCounter: [{ total: 6 }] } },
	});
	await act(async () => document.querySelector('[aria-label="Save Seoul Courtyard"]').click());
	await settle();
	assert.ok(document.querySelector('[aria-label="Unsave Seoul Courtyard"]'));
	assert.equal(document.querySelectorAll('.h-hotel-card').length, 3);
	assert.equal(operations.filter((op) => op.operationName === 'ViewedStays').length, 1);
	assert.equal(client.cache.readQuery({ query: GET_SAVED_STAYS, variables: { input: { page: 2, limit: 6 } } }), null);
});

test('collection invalid page skips API, and failed save keeps the saved hotel visible', async () => {
	await mount(
		collectionPage('saved'),
		() => {
			throw Error('Must not fetch');
		},
		{ category: 'myFavorites', collectionPage: ['1', '2'] },
	);
	assert.match(document.body.textContent, /Check your page/);
	await act(async () => root.unmount());
	client.stop();
	host.remove();
	root = undefined;
	await mount(
		collectionPage('saved'),
		(operation) => {
			if (operation.operationName === 'SavedStays')
				return { getFavorites: { list: [collectionHotels[0]], metaCounter: [{ total: 1 }] } };
			throw Error('Unavailable');
		},
		{ category: 'myFavorites' },
	);
	await settle();
	await act(async () => document.querySelector('[aria-label="Unsave Seoul Courtyard"]').click());
	await settle();
	assert.match(document.body.textContent, /Could not update saved stays/);
	assert.ok(document.querySelector('[aria-label="Unsave Seoul Courtyard"]'));
	assert.equal(document.querySelectorAll('.h-hotel-card').length, 1);
});

const socialHost = {
	__typename: 'Member',
	_id: hotelId,
	memberNick: 'matt',
	memberFullName: 'Matt',
	memberImage: '/img/profile/defaultUser.svg',
	memberDesc: 'Thoughtful stays and warm welcomes.',
	memberType: 'HOTEL_OWNER',
	memberStatus: 'ACTIVE',
	memberHotels: 1,
	memberArticles: 0,
	memberFollowers: 4,
	memberFollowings: 2,
	createdAt: '2025-02-01T00:00:00.000Z',
	meFollowed: [],
};
const publicPage = (child) => React.createElement(PublicLayout, {}, child);
test('host profile follows/unfollows once and refreshes authoritative follow status and counters', async () => {
	let following = false;
	const operations = await mount(
		publicPage(React.createElement(MemberProfile, { host: true })),
		(operation) => {
			if (operation.operationName === 'PublicMember')
				return {
					getMember: {
						...socialHost,
						memberFollowers: following ? 5 : 4,
						meFollowed: following ? [{ followerId: member, followingId: hotelId, myFollowing: true }] : [],
					},
				};
			if (operation.operationName === 'DiscoveryHotels')
				return { getHotels: { list: [collectionHotels[0]], metaCounter: [{ total: 1 }] } };
			if (operation.operationName === 'FollowHoteliaMember') {
				following = true;
				return { subscribe: { _id: 'f'.repeat(24), followerId: member, followingId: hotelId } };
			}
			assert.equal(operation.operationName, 'UnfollowHoteliaMember');
			following = false;
			return { unsubscribe: { _id: 'f'.repeat(24), followerId: member, followingId: hotelId } };
		},
		{ agentId: hotelId },
		undefined,
		'/agent/detail',
	);
	await settle();
	await savePreview('host-profile-ui-test');
	await act(async () => {
		const action = button('Follow');
		action.click();
		action.click();
	});
	await settle();
	await settle();
	assert.equal(operations.filter((op) => op.operationName === 'FollowHoteliaMember').length, 1);
	assert.equal(button('Following').getAttribute('aria-pressed'), 'true');
	assert.match(document.querySelector('.h-profile-stats').textContent, /5Followers/);
	await click('Following');
	await settle();
	assert.equal(operations.filter((op) => op.operationName === 'UnfollowHoteliaMember').length, 1);
	assert.match(document.querySelector('.h-profile-stats').textContent, /4Followers/);
	assert.ok(button('Follow'));
});

test('anonymous profile follow redirects with referrer, and own profile never offers self-follow', async () => {
	const pushed = [];
	const handler = (operation) =>
		operation.operationName === 'PublicMember'
			? { getMember: { ...socialHost, memberType: 'USER', memberArticles: 1 } }
			: {
					getBoardArticles: {
						list: [
							{
								_id: 'e'.repeat(24),
								articleTitle: 'Quiet mornings in Seoul',
								articleImage: collectionHotels[0].hotelImages[0],
								createdAt: '2026-10-01T00:00:00.000Z',
							},
						],
						metaCounter: [{ total: 1 }],
					},
			  };
	const operations = await mount(
		publicPage(React.createElement(MemberProfile)),
		handler,
		{ memberId: hotelId },
		async (value) => {
			pushed.push(value);
			return true;
		},
		'/member',
	);
	await settle();
	await savePreview('member-profile-ui-test');
	await act(async () => userVar({ ...anonymousUser }));
	await settle();
	await click('Follow');
	assert.deepEqual(pushed[0], { pathname: '/account/join', query: { referrer: '/member?memberId=' + hotelId } });
	assert.equal(operations.filter((op) => op.operationName.includes('HoteliaMember')).length, 0);
	await act(async () => userVar({ ...anonymousUser, _id: hotelId, memberNick: 'matt', memberType: 'USER' }));
	await settle();
	assert.equal(
		[...document.querySelectorAll('button')].some((element) => element.textContent === 'Follow'),
		false,
	);
	assert.match(document.body.textContent, /Edit profile/);
});

test('connections use returned member IDs and viewer-specific follow records; malformed pages skip fetching', async () => {
	const operations = await mount(
		publicPage(
			React.createElement(
				AccountLayout,
				{},
				React.createElement(Connections, { memberId: hotelId, kind: 'followers', account: true }),
			),
		),
		(operation) => {
			assert.equal(operation.operationName, 'MemberFollowers');
			assert.deepEqual(operation.variables.input, { page: 2, limit: 6, search: { followingId: hotelId } });
			return {
				getMemberFollowers: {
					list: [
						{
							_id: 'e'.repeat(24),
							followerId: roomId,
							followingId: hotelId,
							followerData: {
								_id: roomId,
								memberNick: 'Clara',
								memberImage: '/img/profile/defaultUser.svg',
								memberDesc: 'Slow travel and quiet courtyards.',
							},
							meFollowed: [{ followerId: member, followingId: roomId, myFollowing: true }],
						},
					],
					metaCounter: [{ total: 7 }],
				},
			};
		},
		{ memberId: hotelId, category: 'followers', networkPage: '2' },
		undefined,
		'/member',
	);
	await settle();
	await savePreview('connections-ui-test');
	assert.ok(document.querySelector('a[href="/member?memberId=' + roomId + '"]'));
	assert.ok(button('Following'));
	assert.equal(operations.length, 1);
	await act(async () => root.unmount());
	client.stop();
	host.remove();
	root = undefined;
	const invalid = await mount(
		React.createElement(Connections, { memberId: hotelId, kind: 'followers' }),
		() => {
			throw Error('Must not fetch');
		},
		{ networkPage: '0' },
	);
	assert.equal(invalid.length, 0);
	assert.match(document.body.textContent, /Check your page/);
});
