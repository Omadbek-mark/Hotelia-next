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
	{ hoteliaTheme } = require('../../scss/MaterialTheme/index.ts');
const { userVar, anonymousUser } = require('../../apollo/store.ts');
const BookingDialog = require('../../libs/components/booking/BookingRequestDialog.tsx').default;
const MyTrips = require('../../libs/components/account/MyTrips.tsx').default;
const MemberProfile = require('../../libs/components/member/MemberProfile.tsx').default;
const Connections = require('../../libs/components/account/Connections.tsx').default;
const StayCollection = require('../../libs/components/account/StayCollection.tsx').default;
const PublicLayout = require('../../libs/components/layout/PublicLayout.tsx').default;
const AccountLayout = require('../../libs/components/layout/AccountLayout.tsx').default;
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
	pathname = '/account',
	role = 'USER',
	unreadCount = 0,
) {
	userVar({ ...anonymousUser, _id: member, memberNick: 'Traveler', memberType: role, memberStatus: 'ACTIVE' });
	const operations = [];
	client = new ApolloClient({
		cache: new InMemoryCache(),
		link: new ApolloLink(
			(operation) =>
				new Observable((observer) => {
					if (operation.operationName !== 'SupportUnreadCount') operations.push(operation);
					Promise.resolve()
						.then(() =>
							operation.operationName === 'SupportUnreadCount'
								? { getUnreadNotificationCount: unreadCount }
								: handler(operation),
						)
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
	root.querySelectorAll('select').forEach((element, index) => {
		const source = document.body.querySelectorAll('select')[index];
		Array.from(element.options).forEach((option) => {
			if (option.value === source.value) option.setAttribute('selected', '');
			else option.removeAttribute('selected');
		});
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
		`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hotelia UI test preview</title><link href="https://fonts.googleapis.com/css2?family=Newsreader:wght@400;500;600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"><style>${css} ${mui} body{margin:0;background:#fcf9f4}.fixture-label{position:fixed;bottom:0;left:0;right:0;z-index:1600;padding:8px;background:#1a2e26;color:white;text-align:center;font:12px Arial}</style></head><body><div class="fixture-label">UI test preview · Sample data · No live records created</div>${root.innerHTML}</body></html>`,
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
	const { GET_SAVED_STAYS } = require('../../apollo/user/collections.ts');
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
		{ ownerId: hotelId },
		undefined,
		'/hotel-owner/detail',
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

const Journal = require('../../libs/components/journal/Journal.tsx').default;
const JournalDetail = require('../../libs/components/journal/JournalDetail.tsx').default;
const ArticleEditor = require('../../libs/components/journal/ArticleEditor.tsx').default;
const { articleInput, storyText } = require('../../libs/journal/model.ts');
const journalArticle = {
	__typename: 'BoardArticle',
	_id: 'e'.repeat(24),
	memberId: member,
	articleCategory: 'TRAVEL_STORY',
	articleTitle: 'Morning light in Bukchon',
	articleContent:
		'Rain on the courtyard tiles. Warm tea by the window. A quiet morning in Seoul, with nowhere else to be.',
	articleImage: 'http://localhost:3021/uploads/hotel/e7526934-e627-42c5-b892-7adacc81f977.jpg',
	articleViews: 142,
	articleLikes: 12,
	articleComments: 1,
	createdAt: '2026-10-01T00:00:00Z',
	meLiked: [{ __typename: 'MeLiked', myFavorite: false }],
	memberData: {
		__typename: 'MemberPublic',
		_id: member,
		memberNick: 'Traveler',
		memberImage: '/img/profile/defaultUser.svg',
		memberDesc: 'Collecting quiet places and small moments.',
	},
};
const journalResponse = {
	getBoardArticles: {
		__typename: 'BoardArticles',
		list: [
			journalArticle,
			{
				...journalArticle,
				_id: 'f'.repeat(24),
				articleCategory: 'DESTINATION_GUIDE',
				articleTitle: 'A slower side of Seoul',
			},
		],
		metaCounter: [{ __typename: 'TotalCounter', total: 2 }],
	},
};
test('journal validates backend limits and renders historical HTML as inert text', () => {
	assert.throws(() => articleInput('Hi', 'story', '', 'FREE'));
	assert.throws(() => articleInput('Title', 'x'.repeat(251), '', 'FREE'));
	assert.throws(() => articleInput('Title', 'Story', '', 'RECOMMEND'));
	assert.equal(articleInput(' Title ', ' Story ', '', 'TRAVEL_TIPS').articleContent, 'Story');
	assert.equal(storyText('<p>Warm &amp; quiet</p><script>alert(1)</script><iframe>bad</iframe>'), 'Warm & quiet');
});
test('journal listing and My journal use backend categories and scoped ownership', async () => {
	const ops = await mount(
		publicPage(React.createElement(AccountLayout, {}, React.createElement(Journal, { own: true }))),
		() => journalResponse,
		{
			category: 'myArticles',
		},
	);
	await settle();
	assert.equal(ops[0].variables.input.search.memberId, member);
	assert.match(document.body.textContent, /Morning light in Bukchon/);
	assert.ok(document.querySelector('a[href*="category=writeArticle&articleId="]'));
	await savePreview('my-articles-ui-test');
	await click('Remove');
	await click('Keep story');
});
test('journal public listing provides category search and story links', async () => {
	const ops = await mount(
		publicPage(React.createElement(Journal)),
		() => journalResponse,
		{},
		async () => true,
		'/journal',
	);
	await settle();
	assert.equal(ops[0].variables.input.search.memberId, undefined);
	assert.equal(
		document.querySelector('a[href*="articleId="]').getAttribute('href'),
		'/journal/detail?articleId=' + journalArticle._id,
	);
	await savePreview('journal-ui-test');
});
test('journal editor preserves category and guards double save with server fields', async () => {
	let saves = 0,
		release;
	const ops = await mount(
		publicPage(React.createElement(AccountLayout, {}, React.createElement(ArticleEditor))),
		(op) => {
			if (op.operationName === 'JournalArticle') return { getBoardArticle: journalArticle };
			saves++;
			return new Promise((r) => {
				release = () => r({ updateBoardArticle: { _id: journalArticle._id } });
			});
		},
		{ category: 'writeArticle', articleId: journalArticle._id },
	);
	await settle();
	assert.ok(document.querySelector('select').disabled);
	await savePreview('article-editor-ui-test');
	await act(async () => {
		button('Save changes').click();
		button('Save changes').click();
	});
	await settle();
	assert.equal(saves, 1);
	const input = ops.find((o) => o.operationName === 'UpdateJournal').variables.input;
	assert.equal(input._id, journalArticle._id);
	assert.equal(input.articleCategory, undefined);
	assert.equal(input.memberId, undefined);
	await act(async () => release());
	await settle();
});
test('journal editor blocks editing another member story', async () => {
	await mount(
		publicPage(React.createElement(AccountLayout, {}, React.createElement(ArticleEditor))),
		() => ({ getBoardArticle: { ...journalArticle, memberId: hotelId } }),
		{ category: 'writeArticle', articleId: journalArticle._id },
	);
	await settle();
	assert.match(document.body.textContent, /cannot be edited/);
	assert.equal(document.querySelector('textarea'), null);
});
test('journal detail refreshes likes and deletes own comment without resending content', async () => {
	let liked = false,
		deleted = false;
	const ops = await mount(
		publicPage(React.createElement(JournalDetail)),
		(op) => {
			if (op.operationName === 'JournalArticle')
				return {
					getBoardArticle: { ...journalArticle, articleLikes: liked ? 13 : 12, meLiked: [{ myFavorite: liked }] },
				};
			if (op.operationName === 'JournalComments')
				return {
					getComments: {
						list: deleted
							? []
							: [
									{
										_id: '1'.repeat(24),
										memberId: member,
										commentContent: 'Such a quiet place.',
										createdAt: '2026-10-02T00:00:00Z',
										memberData: { _id: member, memberNick: 'Traveler', memberImage: '' },
									},
							  ],
						metaCounter: [{ total: deleted ? 0 : 1 }],
					},
				};
			if (op.operationName === 'LikeJournal') {
				liked = true;
				return { likeTargetBoardArticle: { _id: journalArticle._id, articleLikes: 13 } };
			}
			if (op.operationName === 'UpdateJournalComment') {
				deleted = true;
				return { updateComment: { _id: '1'.repeat(24) } };
			}
			throw new Error(op.operationName);
		},
		{ articleId: journalArticle._id },
		async () => true,
		'/journal/detail',
	);
	await settle();
	await savePreview('journal-detail-ui-test');
	await click('♡ Like · 12');
	assert.equal(button('♥ Liked · 13').getAttribute('aria-pressed'), 'true');
	await click('Remove comment');
	await act(async () =>
		[...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent === 'Remove comment').click(),
	);
	await settle();
	const input = ops.find((o) => o.operationName === 'UpdateJournalComment').variables.input;
	assert.deepEqual(input, { _id: '1'.repeat(24), commentStatus: 'DELETE' });
	assert.match(document.body.textContent, /No comments yet/);
});
async function fillJournal(label, value) {
	const field = [...document.querySelectorAll('input,textarea')].find(
		(el) => document.querySelector(`label[for="${el.id}"]`)?.textContent === label,
	);
	assert.ok(field, label);
	await act(async () => require('react-dom/test-utils').Simulate.change(field, { target: { value } }));
}
test('journal publishing trims content, blocks double submit and navigates to returned ID', async () => {
	let release,
		count = 0,
		target;
	const ops = await mount(
		publicPage(React.createElement(AccountLayout, {}, React.createElement(ArticleEditor))),
		() => {
			count++;
			return new Promise((r) => (release = () => r({ createBoardArticle: { _id: journalArticle._id } })));
		},
		{ category: 'writeArticle' },
		async (href) => {
			target = href;
			return true;
		},
	);
	await click('Publish story');
	assert.match(document.body.textContent, /3–50/);
	assert.equal(count, 0);
	await fillJournal('Story title', ' A quiet courtyard ');
	await fillJournal('Story', ' Warm tea by the window. ');
	await act(async () => {
		button('Publish story').click();
		button('Publish story').click();
	});
	await settle();
	assert.equal(count, 1);
	assert.equal(ops[0].variables.input.articleContent, 'Warm tea by the window.');
	assert.equal(ops[0].variables.input.articleCategory, 'FREE');
	await act(async () => release());
	await settle();
	assert.equal(target, '/journal/detail?articleId=' + journalArticle._id);
});
test('journal publisher prevents blind retry after ambiguous failure', async () => {
	await mount(
		publicPage(React.createElement(AccountLayout, {}, React.createElement(ArticleEditor))),
		() => {
			throw new Error('lost response');
		},
		{ category: 'writeArticle' },
	);
	await fillJournal('Story title', 'A quiet courtyard');
	await fillJournal('Story', 'Warm tea by the window.');
	await click('Publish story');
	assert.ok(button('Publish story').disabled);
	assert.match(document.body.textContent, /Check My journal/);
});
test('journal comment creation trims text and omits booking-only fields', async () => {
	const JournalComments = require('../../libs/components/journal/JournalComments.tsx').default;
	const ops = await mount(
		publicPage(React.createElement(JournalComments, { articleId: journalArticle._id, onChange: async () => {} })),
		(op) =>
			op.operationName === 'JournalComments'
				? { getComments: { list: [], metaCounter: [{ total: 0 }] } }
				: { createComment: { _id: '2'.repeat(24) } },
	);
	await fillJournal('Your observation', ' Good morning! ');
	await click('Post comment');
	assert.deepEqual(ops.find((o) => o.operationName === 'JournalComment').variables.input, {
		commentGroup: 'ARTICLE',
		commentRefId: journalArticle._id,
		commentContent: 'Good morning!',
	});
});

const OwnerWorkspace = require('../../libs/components/owner/OwnerWorkspace.tsx').default;
const ownerModel = require('../../libs/owner/model.ts');
const authModule = require('../../libs/auth/index.ts'),
	originalUpdateUser = authModule.updateUserInfo;
afterEach(() => {
	authModule.updateUserInfo = originalUpdateUser;
});
const ownerHotel = {
	__typename: 'Hotel',
	_id: hotelId,
	ownerId: member,
	hotelName: 'Seoul courtyard sanctuary',
	hotelDescription: 'A quiet courtyard, warm timber and thoughtful hospitality.',
	hotelCountry: 'South Korea',
	hotelCity: 'Seoul',
	hotelAddress: '12 Bukchon-ro, Jongno-gu',
	hotelTimezone: 'Asia/Seoul',
	hotelType: 'GUEST_HOUSE',
	hotelStatus: 'ACTIVE',
	hotelImages: [journalArticle.articleImage],
	hotelAmenities: ['WIFI', 'BREAKFAST', 'SPA'],
	hotelRating: 4.8,
	hotelReviews: 12,
	hotelViews: 100,
	hotelLikes: 18,
};
const ownerRoom = {
	__typename: 'Room',
	_id: roomId,
	hotelId,
	roomName: 'Courtyard suite',
	roomDescription: 'Warm timber, quiet mornings and a private view of the courtyard.',
	roomType: 'SUITE',
	roomStatus: 'ACTIVE',
	roomPrice: 140,
	roomCapacity: 2,
	roomQuantity: 3,
	bedType: 'KING',
	roomSize: 62,
	roomImages: [journalArticle.articleImage],
	roomAmenities: ['WIFI', 'AIR_CONDITIONING', 'PRIVATE_BATHROOM'],
};
const ownerBooking = {
	__typename: 'Booking',
	_id: '3'.repeat(24),
	memberId: '4'.repeat(24),
	hotelId,
	roomId,
	checkIn: '2027-11-01T00:00:00Z',
	checkOut: '2027-11-04T00:00:00Z',
	guests: 2,
	rooms: 1,
	nights: 3,
	pricePerNight: 140,
	totalPrice: 420,
	currency: 'USD',
	bookingStatus: 'PENDING',
	expiresAt: '2027-10-31T00:00:00Z',
	createdAt: '2026-10-10T00:00:00Z',
	updatedAt: '2026-10-10T00:00:00Z',
	hotelData: {
		__typename: 'BookingHotelData',
		_id: hotelId,
		hotelName: ownerHotel.hotelName,
		hotelCity: 'Seoul',
		hotelTimezone: 'Asia/Seoul',
		hotelImages: ownerHotel.hotelImages,
	},
	roomData: {
		__typename: 'BookingRoomData',
		_id: roomId,
		roomName: ownerRoom.roomName,
		roomImages: ownerRoom.roomImages,
	},
	memberData: { __typename: 'MemberPublic', _id: '4'.repeat(24), memberNick: 'Evelyn', memberImage: '' },
};
function ownerFixture(op) {
	switch (op.operationName) {
		case 'HostDashboard':
			return {
				getOwnerDashboard: {
					__typename: 'OwnerDashboard',
					totalHotels: 2,
					totalRooms: 8,
					totalBookings: 14,
					totalRevenue: 6840,
					currency: 'USD',
				},
			};
		case 'HostHotels':
			return {
				getOwnerHotels: {
					__typename: 'Hotels',
					list: [
						ownerHotel,
						{
							...ownerHotel,
							_id: '5'.repeat(24),
							hotelName: 'Busan ocean house',
							hotelCity: 'Busan',
							hotelStatus: 'PAUSED',
						},
					],
					metaCounter: [{ total: 2 }],
				},
			};
		case 'HostHotel':
			return { getOwnerHotel: ownerHotel };
		case 'HostRooms':
			return {
				getOwnerRooms: {
					__typename: 'Rooms',
					list: [
						ownerRoom,
						{
							...ownerRoom,
							_id: '6'.repeat(24),
							roomName: 'Garden double',
							roomStatus: 'PAUSED',
							roomType: 'DOUBLE',
							roomPrice: 90,
						},
					],
					metaCounter: [{ total: 2 }],
				},
			};
		case 'HostRoom':
			return { getOwnerRoom: ownerRoom };
		case 'HostReservations':
			return { getOwnerBookings: { __typename: 'Bookings', list: [ownerBooking], metaCounter: [{ total: 1 }] } };
		case 'HostReservation':
			return { getOwnerBooking: ownerBooking };
		default:
			throw new Error('Unexpected ' + op.operationName);
	}
}
async function mountOwner(query = {}, handler = ownerFixture, editor, push = async () => true) {
	authModule.updateUserInfo = async () => true;
	const ops = await mount(
		React.createElement(OwnerWorkspace, { editor }),
		handler,
		query,
		push,
		editor ? '/owner/' + editor : '/owner',
		'HOTEL_OWNER',
	);
	await settle();
	await settle();
	return ops;
}
test('owner models enforce inventory limits, actual enums, timezone and scoped payloads', () => {
	const h = ownerModel.hotelInput({ ...ownerHotel, ownerId: 'bad', hotelStatus: 'DELETE' });
	assert.equal(h.ownerId, undefined);
	assert.equal(h.hotelStatus, undefined);
	assert.throws(() => ownerModel.hotelInput({ ...ownerHotel, hotelTimezone: 'Invalid/Zone' }));
	assert.throws(() => ownerModel.hotelInput({ ...ownerHotel, hotelImages: [] }));
	assert.throws(() => ownerModel.roomInput({ ...ownerRoom, roomPrice: 1.001 }));
	assert.throws(() => ownerModel.roomInput({ ...ownerRoom, roomPrice: 1.00000001 }));
	assert.throws(() => ownerModel.roomInput({ ...ownerRoom, roomQuantity: 1.5 }));
	assert.throws(() => ownerModel.roomInput({ ...ownerRoom, roomCapacity: 0 }));
	assert.throws(() => ownerModel.roomInput({ ...ownerRoom, roomType: 'PENTHOUSE' }));
	assert.equal(ownerModel.roomInput(ownerRoom).roomPrice, 140);
	assert.ok(ownerModel.ownerFilters({ page: ['1'], hotelId }, 'rooms').error);
	assert.ok(ownerModel.ownerFilters({ status: 'DELETE' }, 'hotels').error);
	assert.ok(ownerModel.ownerFilters({ checkIn: '2026-02-30', checkOut: '2026-03-03' }, 'bookings').error);
	assert.equal(ownerModel.ownerFilters({ hotelId, status: 'PAUSED' }, 'rooms').error, undefined);
});
test('owner reservation eligibility follows expiry and hotel-local dates', () => {
	const now = new Date('2026-10-09T16:00:00Z');
	assert.equal(ownerModel.reservationActions({ ...ownerBooking, checkIn: '2026-10-09T00:00:00Z' }, now).confirm, false);
	assert.equal(
		ownerModel.reservationActions({ ...ownerBooking, expiresAt: '2026-10-09T15:00:00Z' }, now).confirm,
		false,
	);
	assert.equal(
		ownerModel.reservationActions(
			{ ...ownerBooking, bookingStatus: 'CONFIRMED', checkOut: '2026-10-10T00:00:00Z' },
			now,
		).complete,
		true,
	);
	assert.equal(
		ownerModel.reservationActions(
			{ ...ownerBooking, bookingStatus: 'CONFIRMED', checkOut: '2026-10-11T00:00:00Z' },
			now,
		).complete,
		false,
	);
	assert.deepEqual(ownerModel.reservationActions({ ...ownerBooking, bookingStatus: 'COMPLETED' }, now), {
		confirm: false,
		complete: false,
		cancel: false,
	});
});
test('owner dashboard gate blocks guest queries and preserves sign-in referrer', async () => {
	authModule.updateUserInfo = async () => true;
	const ops = await mount(React.createElement(OwnerWorkspace), ownerFixture, {}, async () => true, '/owner');
	await settle();
	assert.match(document.body.textContent, /Access restricted/);
	assert.equal(ops.length, 0);
	await act(async () => userVar({ ...anonymousUser }));
	await settle();
	assert.match(document.body.textContent, /Sign in to continue/);
	assert.match(document.querySelector('a[href*="referrer"]').href, /referrer=%2Fowner/);
});
test('owner overview renders authoritative revenue and operational links', async () => {
	await mountOwner();
	assert.match(document.body.textContent, /6,840/);
	assert.match(document.body.textContent, /completed stays only/);
	assert.ok(document.querySelector('a[href="/owner?tab=rooms"]'));
	await savePreview('owner-overview-ui-test');
});
test('owner hotel pause executes once and refreshes server status; delete uses dedicated mutation', async () => {
	let status = 'ACTIVE',
		removed = false,
		count = 0,
		release;
	const ops = await mountOwner({ tab: 'hotels' }, (op) => {
		if (op.operationName === 'HostHotels')
			return {
				getOwnerHotels: {
					list: removed ? [] : [{ ...ownerHotel, hotelStatus: status }],
					metaCounter: [{ total: removed ? 0 : 1 }],
				},
			};
		if (op.operationName === 'HostUpdateHotel') {
			count++;
			return new Promise(
				(r) =>
					(release = () => {
						status = 'PAUSED';
						r({ updateHotel: { _id: hotelId, hotelStatus: status } });
					}),
			);
		}
		if (op.operationName === 'HostDeleteHotel') {
			removed = true;
			return { deleteHotel: { _id: hotelId, hotelStatus: 'DELETE' } };
		}
		throw new Error(op.operationName);
	});
	await savePreview('owner-hotels-ui-test');
	await act(async () => {
		button('Pause listing').click();
		button('Pause listing').click();
	});
	await settle();
	assert.equal(count, 1);
	await act(async () => release());
	await settle();
	assert.ok(button('Activate listing'));
	assert.deepEqual(ops.find((o) => o.operationName === 'HostUpdateHotel').variables.input, {
		_id: hotelId,
		hotelStatus: 'PAUSED',
	});
	await click('Remove hotel');
	await click('Remove listing');
	assert.equal(ops.find((o) => o.operationName === 'HostDeleteHotel').variables.hotelId, hotelId);
	assert.match(document.body.textContent, /next sanctuary/);
});
test('owner room inventory is scoped and invalid IDs skip fetching', async () => {
	const ops = await mountOwner({ tab: 'rooms', hotelId });
	assert.equal(ops.find((o) => o.operationName === 'HostRooms').variables.input.hotelId, hotelId);
	assert.match(document.body.textContent, /3 units/);
	await savePreview('owner-rooms-ui-test');
	await act(async () => root.unmount());
	root = null;
	host.remove();
	host = null;
	const invalid = await mountOwner({ tab: 'rooms', hotelId: 'bad' });
	assert.equal(invalid.length, 0);
	assert.match(document.body.textContent, /valid hotel/);
});
test('owner hotel editor submits only editable fields and guards double save', async () => {
	let saves = 0,
		release;
	const ops = await mountOwner(
		{ hotelId },
		(op) =>
			op.operationName === 'HostUpdateHotel'
				? (saves++, new Promise((r) => (release = () => r({ updateHotel: { _id: hotelId, hotelStatus: 'ACTIVE' } }))))
				: ownerFixture(op),
		'hotel',
	);
	await savePreview('owner-hotel-editor-ui-test');
	await act(async () => {
		button('Save hotel').click();
		button('Save hotel').click();
	});
	await settle();
	assert.equal(saves, 1);
	const input = ops.find((o) => o.operationName === 'HostUpdateHotel').variables.input;
	assert.equal(input.ownerId, undefined);
	assert.equal(input.hotelTimezone, 'Asia/Seoul');
	assert.equal(input.hotelStatus, 'ACTIVE');
	await act(async () => release());
	await settle();
});
test('owner room editor keeps parent immutable and displays inventory conflict', async () => {
	const ops = await mountOwner(
		{ hotelId, roomId },
		(op) => {
			if (op.operationName === 'HostUpdateRoom')
				throw new Error('Cannot reduce inventory or capacity while active bookings exist');
			return ownerFixture(op);
		},
		'room',
	);
	await savePreview('owner-room-editor-ui-test');
	await fillJournal('Units in inventory', '1');
	await click('Save room');
	const input = ops.find((o) => o.operationName === 'HostUpdateRoom').variables.input;
	assert.equal(input.hotelId, undefined);
	assert.equal(input.roomQuantity, 1);
	assert.match(document.body.textContent, /Existing reservations prevent/);
});
test('owner reservations re-read eligibility and confirm once with authoritative status', async () => {
	let status = 'PENDING',
		count = 0,
		release;
	const ops = await mountOwner({ tab: 'bookings' }, (op) => {
		if (op.operationName === 'HostReservations')
			return { getOwnerBookings: { list: [{ ...ownerBooking, bookingStatus: status }], metaCounter: [{ total: 1 }] } };
		if (op.operationName === 'HostReservation') return { getOwnerBooking: { ...ownerBooking, bookingStatus: status } };
		if (op.operationName === 'HostConfirmReservation') {
			count++;
			return new Promise(
				(r) =>
					(release = () => {
						status = 'CONFIRMED';
						r({ confirmBooking: { ...ownerBooking, bookingStatus: status } });
					}),
			);
		}
		throw new Error(op.operationName);
	});
	await savePreview('owner-reservations-ui-test');
	await click('Confirm booking');
	await act(async () => {
		button('Confirm action').click();
		button('Confirm action').click();
	});
	await settle();
	assert.equal(count, 1);
	assert.equal(ops.find((o) => o.operationName === 'HostReservation').variables.bookingId, ownerBooking._id);
	await act(async () => release());
	await settle();
	assert.match(document.body.textContent, /Confirmed/);
	assert.equal(
		[...document.querySelectorAll('button')].some((b) => b.textContent === 'Confirm booking'),
		false,
	);
});
test('owner reservations refuse action after authoritative status changed', async () => {
	const ops = await mountOwner({ tab: 'bookings' }, (op) =>
		op.operationName === 'HostReservation'
			? { getOwnerBooking: { ...ownerBooking, bookingStatus: 'CANCELLED' } }
			: ownerFixture(op),
	);
	await click('Confirm booking');
	await click('Confirm action');
	assert.equal(
		ops.some((o) => o.operationName === 'HostConfirmReservation'),
		false,
	);
	assert.match(document.body.textContent, /reservation has changed/);
});
const uploadModule = require('../../libs/api/upload.ts'),
	originalUploadImages = uploadModule.uploadImages;
afterEach(() => {
	uploadModule.uploadImages = originalUploadImages;
});
async function attachOwnerPhoto() {
	uploadModule.uploadImages = async (files, target) => {
		assert.equal(files.length, 1);
		assert.ok(['hotel', 'room'].includes(target));
		return [journalArticle.articleImage];
	};
	await act(async () =>
		require('react-dom/test-utils').Simulate.change(document.querySelector('input[type=file]'), {
			target: { files: [new dom.window.File(['fixture'], 'cover.jpg', { type: 'image/jpeg' })], value: '' },
		}),
	);
	await settle();
}
test('owner creates a hotel without client owner/status and proceeds to room inventory', async () => {
	let destination;
	const ops = await mountOwner(
		{},
		(op) => {
			assert.equal(op.operationName, 'HostCreateHotel');
			return { createHotel: { _id: hotelId } };
		},
		'hotel',
		async (href) => {
			destination = href;
			return true;
		},
	);
	await click('Save hotel');
	assert.equal(ops.length, 0);
	await fillJournal('Hotel name', ' New courtyard ');
	await fillJournal('Description', ownerHotel.hotelDescription);
	await fillJournal('Country', 'South Korea');
	await fillJournal('City', 'Seoul');
	await fillJournal('Street address', '12 Bukchon-ro');
	await attachOwnerPhoto();
	await savePreview('owner-add-hotel-ui-test');
	await click('Save hotel');
	assert.equal(ops[0].variables.input.hotelName, 'New courtyard');
	assert.equal(ops[0].variables.input.ownerId, undefined);
	assert.equal(ops[0].variables.input.hotelStatus, undefined);
	assert.equal(destination, `/owner?tab=rooms&hotelId=${hotelId}`);
});
test('owner creates a room under the selected hotel with validated numeric fields', async () => {
	const ops = await mountOwner(
		{ hotelId },
		(op) => (op.operationName === 'HostCreateRoom' ? { createRoom: { _id: roomId, hotelId } } : ownerFixture(op)),
		'room',
	);
	await fillJournal('Room name', 'Garden suite');
	await fillJournal('Description', ownerRoom.roomDescription);
	await fillJournal('Nightly price (USD)', '149.50');
	await attachOwnerPhoto();
	await savePreview('owner-add-room-ui-test');
	await click('Save room');
	const input = ops.find((o) => o.operationName === 'HostCreateRoom').variables.input;
	assert.equal(input.hotelId, hotelId);
	assert.equal(input.roomPrice, 149.5);
	assert.equal(input.roomStatus, undefined);
	assert.equal(input._id, undefined);
});

test('hotel availability form applies stay dates with the canonical hotelId', async () => {
	const Availability = require('../../libs/components/hotel/StayAvailabilityForm.tsx').default;
	const selectedStay = { checkIn: '2099-11-01', checkOut: '2099-11-04', guests: 3, rooms: 2 };
	let applied;
	await mount(
		React.createElement(Availability, {
			hotelId,
			timezone: 'Asia/Seoul',
			stay: selectedStay,
			onApply: async (value) => {
				applied = value;
			},
		}),
		() => {
			throw Error('No query expected');
		},
	);
	const originalFormData = global.FormData;
	global.FormData = dom.window.FormData;
	try {
		await act(async () => require('react-dom/test-utils').Simulate.submit(document.querySelector('form')));
		assert.deepEqual(applied, selectedStay);
		assert.doesNotMatch(document.body.textContent, /Choose a valid hotel/);
	} finally {
		global.FormData = originalFormData;
	}
});

const SupportPage = require('../../libs/components/support/SupportPage.tsx').default;
const Inquiries = require('../../libs/components/support/Inquiries.tsx').default;
const NotificationsPanel = require('../../libs/components/support/Notifications.tsx').default;
const supportRow = {
	__typename: 'SupportNotice',
	_id: 'd'.repeat(24),
	noticeCategory: 'INQUIRY',
	noticeStatus: 'HOLD',
	noticeTitle: 'Late arrival',
	noticeContent: 'Can I arrive after midnight?',
	noticeResponse: null,
	respondedAt: null,
	createdAt: '2026-10-10T10:00:00Z',
	updatedAt: '2026-10-10T10:00:00Z',
};
async function fillSupport(label, value) {
	const field = [...document.querySelectorAll('input,textarea')].find(
		(el) => document.querySelector(`label[for="${el.id}"]`)?.textContent.replace('*', '').trim() === label,
	);
	assert.ok(field, label);
	await act(async () => require('react-dom/test-utils').Simulate.change(field, { target: { value } }));
}

test('support FAQ search filters honest booking guides and renders plain text published FAQs', async () => {
	await mount(
		React.createElement(SupportPage),
		(op) => {
			assert.equal(op.operationName, 'SupportNotices');
			assert.equal(op.variables.input.noticeCategory, 'FAQ');
			return {
				getSupportNotices: {
					list: [
						{
							...supportRow,
							noticeCategory: 'FAQ',
							noticeTitle: 'Published guide',
							noticeContent: '<script>bad()</script>',
						},
					],
					metaCounter: [{ total: 1 }],
				},
			};
		},
		{},
		undefined,
		'/support',
	);
	await settle();
	assert.match(document.body.textContent, /How does booking work/);
	assert.match(document.body.textContent, /<script>bad\(\)<\/script>/);
	assert.equal(document.querySelector('script'), null);
	await savePreview('support-faq-ui-test');
	await fillSupport('Search answers', 'review');
	assert.doesNotMatch(document.body.textContent, /How does booking work/);
	assert.match(document.body.textContent, /When can I write a review/);
});
test('support notices show backend policies, page filters and empty state without fabricated notices', async () => {
	const ops = await mount(
		React.createElement(SupportPage),
		(op) => ({ getSupportNotices: { list: [], metaCounter: [] } }),
		{ tab: 'notices', noticeCategory: 'TERMS', page: '2' },
		undefined,
		'/support',
	);
	await settle();
	assert.equal(ops[0].variables.input.noticeCategory, 'TERMS');
	assert.equal(ops[0].variables.input.page, 2);
	assert.match(document.body.textContent, /No published notices/);
	await savePreview('support-notices-ui-test');
});
test('private support tabs wait for authentication and never query private data for anonymous viewers', async () => {
	authModule.updateUserInfo = async () => {
		userVar({ ...anonymousUser });
		return false;
	};
	const ops = await mount(
		React.createElement(SupportPage),
		() => {
			throw Error('Unexpected private query');
		},
		{ tab: 'inquiries' },
		undefined,
		'/support',
		'',
	);
	await act(async () => userVar({ ...anonymousUser }));
	await settle();
	assert.match(document.body.textContent, /Sign in to continue/);
	assert.equal(ops.filter((op) => op.operationName === 'MySupportInquiries').length, 0);
	assert.match(document.querySelector('main a').getAttribute('href'), /referrer=/);
});
test('inquiry creation trims content, locks double submission and refreshes private messages', async () => {
	let sent = false,
		release,
		calls = 0,
		input;
	const ops = await mount(React.createElement(Inquiries, { page: 1, onPage: () => {} }), (op) => {
		if (op.operationName === 'MySupportInquiries')
			return { getMyInquiries: { list: sent ? [supportRow] : [], metaCounter: [{ total: sent ? 1 : 0 }] } };
		assert.equal(op.operationName, 'SendSupportInquiry');
		calls++;
		input = op.variables.input;
		return new Promise((resolve) => {
			release = () => {
				sent = true;
				resolve({ createSupportInquiry: supportRow });
			};
		});
	});
	await fillSupport('Subject', '  Late arrival  ');
	await fillSupport('Message', '  Can I arrive after midnight?  ');
	await act(async () => {
		require('react-dom/test-utils').Simulate.submit(document.querySelector('form'));
		require('react-dom/test-utils').Simulate.submit(document.querySelector('form'));
	});
	await settle();
	assert.equal(calls, 1);
	assert.deepEqual(Object.keys(input).sort(), ['noticeContent', 'noticeTitle', 'requestId']);
	assert.equal(input.noticeTitle, 'Late arrival');
	assert.equal(input.noticeContent, 'Can I arrive after midnight?');
	assert.match(input.requestId, /^[a-f\d-]{36}$/i);
	await act(async () => release());
	await settle();
	assert.match(document.body.textContent, /Message received/);
	assert.match(document.body.textContent, /Received/);
	assert.equal(ops.filter((op) => op.operationName === 'MySupportInquiries').length, 2);
	await savePreview('support-inquiries-ui-test');
});
test('ambiguous inquiry delivery retries the same request identity and blocks changed content', async () => {
	const requests = [];
	await mount(React.createElement(Inquiries, { page: 1, onPage: () => {} }), (op) => {
		if (op.operationName === 'MySupportInquiries') return { getMyInquiries: { list: [], metaCounter: [] } };
		requests.push(op.variables.input);
		throw Error('Lost response');
	});
	await fillSupport('Subject', 'Late arrival');
	await fillSupport('Message', 'Can I arrive after midnight?');
	await act(async () => require('react-dom/test-utils').Simulate.submit(document.querySelector('form')));
	await settle();
	await act(async () => require('react-dom/test-utils').Simulate.submit(document.querySelector('form')));
	await settle();
	assert.equal(requests.length, 2);
	assert.equal(requests[0].requestId, requests[1].requestId);
	await fillSupport('Message', 'Can I arrive after one in the morning?');
	await act(async () => require('react-dom/test-utils').Simulate.submit(document.querySelector('form')));
	await settle();
	assert.equal(requests.length, 2);
	assert.match(document.body.textContent, /previous message may have been sent/);
});
test('notifications use server read status, block double marking and refresh the list', async () => {
	let read = false,
		calls = 0;
	const row = {
		_id: 'e'.repeat(24),
		notificationType: 'BOOKING_CONFIRMED',
		notificationGroup: 'BOOKING',
		notificationTitle: 'Your stay is confirmed',
		notificationDesc: 'Open My trips for the details.',
		hotelId,
		bookingId: 'd'.repeat(24),
		createdAt: '2026-10-10T10:00:00Z',
		updatedAt: '2026-10-10T10:00:00Z',
	};
	await mount(React.createElement(NotificationsPanel, { page: 1, onPage: () => {} }), (op) => {
		if (op.operationName === 'SupportNotifications')
			return {
				getMyNotifications: {
					list: [{ ...row, notificationStatus: read ? 'READ' : 'WAIT' }],
					metaCounter: [{ total: 1 }],
				},
			};
		assert.equal(op.operationName, 'ReadSupportNotification');
		calls++;
		read = true;
		return { markNotificationRead: { _id: row._id, notificationStatus: 'READ', updatedAt: row.updatedAt } };
	});
	await settle();
	await savePreview('support-notifications-ui-test');
	await act(async () => {
		button('Mark as read').click();
		button('Mark as read').click();
	});
	await settle();
	assert.equal(calls, 1);
	assert.match(document.body.textContent, /Read/);
	assert.equal([...document.querySelectorAll('button')].filter((b) => b.textContent === 'Mark as read').length, 0);
});
test('malformed support routes do not request support collections', async () => {
	const ops = await mount(
		React.createElement(SupportPage),
		() => {
			throw Error('Unexpected collection request');
		},
		{ tab: ['faq', 'notices'] },
		undefined,
		'/support',
	);
	await settle();
	assert.match(document.body.textContent, /Check your support link/);
	assert.equal(ops.length, 0);
});

test('confirmed inquiry receipt stays successful if refreshing the message list fails', async () => {
	let queries = 0;
	await mount(React.createElement(Inquiries, { page: 1, onPage: () => {} }), (op) => {
		if (op.operationName === 'MySupportInquiries') {
			if (++queries > 1) throw Error('List unavailable');
			return { getMyInquiries: { list: [], metaCounter: [] } };
		}
		return { createSupportInquiry: supportRow };
	});
	await fillSupport('Subject', 'Late arrival');
	await fillSupport('Message', 'Can I arrive after midnight?');
	await act(async () => require('react-dom/test-utils').Simulate.submit(document.querySelector('form')));
	await settle();
	assert.match(document.body.textContent, /Message received/);
	assert.doesNotMatch(document.body.textContent, /could not confirm delivery/);
});

test('support inquiries page opens authenticated messages and safely renders replies', async () => {
	authModule.updateUserInfo = async () => true;
	const ops = await mount(
		React.createElement(SupportPage),
		(op) => {
			assert.equal(op.operationName, 'MySupportInquiries');
			return {
				getMyInquiries: {
					list: [
						{
							...supportRow,
							noticeResponse: 'Open My trips to check the latest reservation status.',
							respondedAt: '2026-10-10T12:00:00Z',
						},
					],
					metaCounter: [{ total: 1 }],
				},
			};
		},
		{ tab: 'inquiries' },
		undefined,
		'/support',
	);
	await settle();
	assert.equal(ops.length, 1);
	assert.match(document.body.textContent, /Replied/);
	assert.match(document.body.textContent, /Hotelia support/);
	await savePreview('support-inquiries-page-ui-test');
});
test('support notifications page exposes an unread badge and reservation navigation', async () => {
	authModule.updateUserInfo = async () => true;
	await mount(
		React.createElement(SupportPage),
		(op) => {
			assert.equal(op.operationName, 'SupportNotifications');
			return {
				getMyNotifications: {
					list: [
						{
							_id: 'e'.repeat(24),
							notificationType: 'BOOKING_CONFIRMED',
							notificationStatus: 'WAIT',
							notificationGroup: 'BOOKING',
							notificationTitle: 'Your stay is confirmed',
							notificationDesc: 'See your trip for dates and room details.',
							hotelId,
							bookingId: 'd'.repeat(24),
							createdAt: '2026-10-10T10:00:00Z',
							updatedAt: '2026-10-10T10:00:00Z',
						},
					],
					metaCounter: [{ total: 1 }],
				},
			};
		},
		{ tab: 'notifications' },
		undefined,
		'/support',
		'USER',
		1,
	);
	await settle();
	assert.ok(document.querySelector('a[aria-label="Notifications, 1 unread"]'));
	assert.match(document.body.textContent, /Unread/);
	assert.equal(
		[...document.querySelectorAll('a')].find((a) => a.textContent === 'View reservations').getAttribute('href'),
		'/account?category=myBookings',
	);
	await savePreview('support-notifications-page-ui-test');
});

const AdminPage = require('../../libs/components/admin/AdminPage.tsx').default;
const adminModel = require('../../libs/admin/model.ts');
const adminNotice = {
	...supportRow,
	__typename: 'AdminSupportNotice',
	memberId: member,
	noticeRevision: 2,
	noticeCategory: 'FAQ',
	noticeStatus: 'ACTIVE',
	noticeTitle: 'Plan a smoother arrival',
	noticeContent: 'Check your confirmed reservation before travelling.',
	noticeResponse: null,
	respondedAt: null,
};
const adminMember = {
	__typename: 'Member',
	_id: 'e'.repeat(24),
	memberNick: 'Mina',
	memberFullName: 'Mina Park',
	memberImage: '/img/hotelia/stay-placeholder.svg',
	memberType: 'HOTEL_OWNER',
	memberStatus: 'ACTIVE',
	memberHotels: 2,
	createdAt: base.createdAt,
};
const adminHotel = {
	...ownerHotel,
	__typename: 'Hotel',
	createdAt: base.createdAt,
	memberData: { __typename: 'MemberPublic', _id: member, memberNick: 'Mina' },
};
const adminArticle = {
	__typename: 'BoardArticle',
	_id: 'f'.repeat(24),
	articleTitle: 'A quiet morning in Seoul',
	articleContent: 'Courtyards, warm light and room to slow down.',
	articleImage: '/img/hotelia/stay-placeholder.svg',
	articleCategory: 'TRAVEL_STORY',
	articleStatus: 'ACTIVE',
	createdAt: base.createdAt,
	memberData: { __typename: 'MemberPublic', _id: member, memberNick: 'Mina' },
};
const collection = (list) => ({ list, metaCounter: [{ total: list.length }] });
function adminFixture(op) {
	switch (op.operationName) {
		case 'AdminOverview':
			return {
				hotels: { metaCounter: [{ total: 18 }] },
				members: { metaCounter: [{ total: 142 }] },
				journal: { metaCounter: [{ total: 24 }] },
				inquiries: collection([{ _id: adminNotice._id, noticeTitle: 'Late arrival', createdAt: base.createdAt }]),
				bookings: collection([ownerBooking]),
			};
		case 'AdminHotels':
			return {
				getAllHotelsByAdmin: collection([
					adminHotel,
					{
						...adminHotel,
						_id: '1'.repeat(24),
						hotelName: 'Coastal retreat',
						hotelCity: 'Busan',
						hotelStatus: 'PAUSED',
					},
				]),
			};
		case 'AdminMembers':
			return {
				getAllMembersByAdmin: collection([
					adminMember,
					{ ...adminMember, _id: member, memberNick: 'Administrator', memberType: 'ADMIN', memberHotels: 0 },
					{ ...adminMember, _id: '2'.repeat(24), memberNick: 'Traveler', memberType: 'USER', memberHotels: 0 },
				]),
			};
		case 'AdminJournal':
			return { getAllBoardArticlesByAdmin: collection([adminArticle]) };
		case 'AdminRooms':
			return { getAllRoomsByAdmin: collection([ownerRoom]) };
		case 'AdminReservations':
			return {
				getAllBookingsByAdmin: collection([
					ownerBooking,
					{ ...ownerBooking, _id: '4'.repeat(24), bookingStatus: 'COMPLETED' },
				]),
			};
		case 'AdminSupport':
			return {
				getSupportByAdmin: collection([
					{
						...adminNotice,
						noticeCategory: op.variables.input.noticeCategory,
						noticeStatus: op.variables.input.noticeCategory === 'INQUIRY' ? 'HOLD' : 'ACTIVE',
						noticeTitle: op.variables.input.noticeCategory === 'INQUIRY' ? 'Late arrival' : adminNotice.noticeTitle,
					},
				]),
			};
		default:
			throw Error('Unexpected admin operation ' + op.operationName);
	}
}
async function mountAdmin(
	path = '/_admin',
	query = {},
	handler = adminFixture,
	role = 'ADMIN',
	push = async () => true,
) {
	authModule.updateUserInfo = async () => true;
	const ops = await mount(React.createElement(AdminPage), handler, query, push, path, role);
	await settle();
	await settle();
	return ops;
}
for (const [name, path] of [
	['overview', '/_admin'],
	['hotels', '/_admin/hotels'],
	['members', '/_admin/users'],
	['journal', '/_admin/journal'],
	['rooms', '/_admin/rooms'],
	['reservations', '/_admin/bookings'],
	['faq', '/_admin/support/faq'],
	['notices', '/_admin/support/notice'],
	['inquiries', '/_admin/support/inquiry'],
]) {
	test('admin workspace renders ' + name + ' through its protected full layout', async () => {
		const ops = await mountAdmin(path);
		assert.ok(ops.length > 0);
		assert.ok(document.querySelector('nav[aria-label="Dashboard navigation"]'));
		assert.equal(
			document.querySelector('nav[aria-label="Dashboard navigation"] a[aria-current="page"]').getAttribute('href'),
			path,
		);
		assert.doesNotMatch(document.body.textContent, /planned for/);
		await savePreview('admin-' + name + '-ui-test');
	});
}
test('admin gates do not fetch private data for guests hotel owners or anonymous sessions', async () => {
	const ops = await mountAdmin('/_admin', {}, adminFixture, 'USER');
	assert.equal(ops.length, 0);
	assert.match(document.body.textContent, /Access restricted/);
	await act(async () => userVar({ ...userVar(), memberType: 'HOTEL_OWNER' }));
	await settle();
	assert.equal(ops.length, 0);
	await act(async () => userVar({ ...anonymousUser }));
	await settle();
	assert.equal(ops.length, 0);
	assert.match(document.body.textContent, /Sign in to continue/);
});
test('admin filters reject invalid enums arrays IDs and pages before a query', async () => {
	for (const q of [{ page: '0' }, { page: '1.5' }, { status: 'ACTIVE', type: 'AGENT' }, { text: ['a', 'b'] }])
		assert.equal(adminModel.parseAdminFilters('users', q).valid, false);
	assert.equal(adminModel.parseAdminFilters('rooms', { hotelId: 'bad' }).valid, false);
	const ops = await mountAdmin('/_admin/hotels', { page: '0' });
	assert.equal(ops.length, 0);
	assert.match(document.body.textContent, /Check the filters/);
});
test('admin hotel pause requires confirmation locks repeated clicks and refreshes server state', async () => {
	let release,
		calls = 0,
		paused = false;
	const ops = await mountAdmin('/_admin/hotels', {}, (op) => {
		if (op.operationName === 'AdminHotels')
			return { getAllHotelsByAdmin: collection([{ ...adminHotel, hotelStatus: paused ? 'PAUSED' : 'ACTIVE' }]) };
		assert.equal(op.operationName, 'AdminHotelStatus');
		calls++;
		assert.deepEqual(op.variables.input, { _id: adminHotel._id, hotelStatus: 'PAUSED' });
		return new Promise(
			(resolve) =>
				(release = () => {
					paused = true;
					resolve({ updateHotelByAdmin: { __typename: 'Hotel', _id: adminHotel._id, hotelStatus: 'PAUSED' } });
				}),
		);
	});
	await click('Pause hotel');
	assert.equal(calls, 0);
	await click('Keep current');
	assert.equal(calls, 0);
	await click('Pause hotel');
	await act(async () => {
		button('Confirm change').click();
		button('Confirm change').click();
	});
	await settle();
	assert.equal(calls, 1);
	await act(async () => release());
	await settle();
	assert.ok(button('Activate hotel'));
	assert.equal(ops.filter((o) => o.operationName === 'AdminHotels').length, 2);
	assert.match(document.body.textContent, /Change saved/);
});
test('admin members protect administrators and owners with hotels from role downgrade', async () => {
	await mountAdmin('/_admin/users');
	const rows = [...document.querySelectorAll('.h-admin-row')];
	assert.equal(rows[0].querySelector('button').disabled, true);
	assert.equal(rows[1].querySelectorAll('button').length, 0);
	assert.equal(rows[2].querySelector('button').disabled, false);
	assert.match(rows[1].textContent, /Protected administrator/);
});
test('admin archived journal and terminal bookings offer only supported actions', async () => {
	await mountAdmin('/_admin/journal', {}, (op) => ({
		getAllBoardArticlesByAdmin: collection([
			{ ...adminArticle, articleStatus: 'DELETE', articleContent: '<script>neverRun()</script>' },
		]),
	}));
	assert.equal(document.querySelectorAll('.h-admin-story button').length, 0);
	assert.equal(document.querySelectorAll('script').length, 0);
	assert.match(document.body.textContent, /<script>/);
});
test('admin support publication needs review trims input and confirms receipt despite failed refresh', async () => {
	let calls = 0,
		reads = 0;
	await mountAdmin('/_admin/support/faq', {}, (op) => {
		if (op.operationName === 'AdminSupport') {
			if (++reads > 1) throw Error('List unavailable');
			return { getSupportByAdmin: collection([]) };
		}
		assert.equal(op.operationName, 'AdminSupportCreate');
		calls++;
		const input = op.variables.input;
		assert.equal(input.noticeCategory, 'FAQ');
		assert.equal(input.noticeStatus, 'ACTIVE');
		assert.equal(input.noticeTitle, 'Arrival guide');
		assert.match(input.requestId, /^[a-f\d-]{36}$/i);
		assert.equal(input.memberId, undefined);
		return { createSupportByAdmin: { ...adminNotice, noticeTitle: input.noticeTitle } };
	});
	await click('Add FAQ ↗');
	await fillSupport('Title', '  Arrival guide  ');
	await fillSupport('Content', '  Check the reservation status before arriving.  ');
	await act(async () =>
		require('react-dom/test-utils').Simulate.change(document.querySelector('[role="dialog"] select'), {
			target: { value: 'ACTIVE' },
		}),
	);
	await click('Review change');
	assert.equal(calls, 0);
	assert.match(document.body.textContent, /visible to everyone/);
	await savePreview('admin-notice-editor-ui-test');
	await click('Confirm save');
	assert.equal(calls, 1);
	assert.match(document.body.textContent, /Saved. Refresh/);
});
test('admin notice creation retries one identity and blocks changed ambiguous payload', async () => {
	const inputs = [];
	await mountAdmin('/_admin/support/notice', {}, (op) => {
		if (op.operationName === 'AdminSupport') return adminFixture(op);
		inputs.push(op.variables.input);
		throw Error('Lost receipt');
	});
	await click('Add notice ↗');
	await fillSupport('Title', 'Platform update');
	await fillSupport('Content', 'A helpful update for future stays.');
	await click('Review change');
	await click('Confirm save');
	await click('Review change');
	await click('Confirm save');
	assert.equal(inputs.length, 2);
	assert.equal(inputs[0].requestId, inputs[1].requestId);
	await fillSupport('Content', 'A different helpful update for future stays.');
	await click('Review change');
	assert.equal(inputs.length, 2);
	assert.match(document.body.textContent, /Retry it unchanged/);
});
test('admin replies use the server revision keep inquiry content private and refresh after conflict', async () => {
	let sent;
	await mountAdmin('/_admin/support/inquiry', {}, (op) => {
		if (op.operationName === 'AdminSupport') return adminFixture(op);
		sent = op.variables.input;
		throw Error('Revision changed');
	});
	await click('Reply');
	await fillSupport('Reply', '  Please check your confirmed reservation in My trips.  ');
	await click('Review reply');
	assert.equal(sent, undefined);
	await savePreview('admin-reply-editor-ui-test');
	await click('Confirm reply');
	assert.deepEqual(sent, {
		_id: adminNotice._id,
		expectedRevision: 2,
		noticeResponse: 'Please check your confirmed reservation in My trips.',
	});
	assert.match(document.body.textContent, /Check the refreshed record/);
});

test('admin reservation cancellation is unavailable after completion and requires confirmation for pending stays', async () => {
	let variables;
	await mountAdmin('/_admin/bookings', {}, (op) => {
		if (op.operationName === 'AdminReservations') return adminFixture(op);
		variables = op.variables;
		return { cancelBookingByAdmin: { __typename: 'Booking', _id: ownerBooking._id, bookingStatus: 'CANCELLED' } };
	});
	const rows = [...document.querySelectorAll('.h-admin-reservation')];
	assert.equal(rows[1].querySelectorAll('button').length, 0);
	await click('Cancel reservation');
	assert.equal(variables, undefined);
	await click('Confirm change');
	assert.deepEqual(variables, { bookingId: ownerBooking._id });
});
test('admin room status uses room mutation without changing price or inventory', async () => {
	let input;
	await mountAdmin('/_admin/rooms', {}, (op) => {
		if (op.operationName === 'AdminRooms') return adminFixture(op);
		input = op.variables.input;
		return { updateRoomByAdmin: { __typename: 'Room', _id: ownerRoom._id, roomStatus: 'PAUSED' } };
	});
	await click('Pause room');
	await click('Confirm change');
	assert.deepEqual(input, { _id: ownerRoom._id, roomStatus: 'PAUSED' });
});
test('admin notice editing publishes only the existing record with its server revision', async () => {
	let input;
	await mountAdmin('/_admin/support/faq', {}, (op) => {
		if (op.operationName === 'AdminSupport') return adminFixture(op);
		input = op.variables.input;
		return { updateSupportByAdmin: { ...adminNotice, ...input, noticeRevision: 3 } };
	});
	await click('Manage');
	await fillSupport('Content', 'Updated helpful guidance for an easy arrival.');
	await click('Review change');
	assert.equal(input, undefined);
	await click('Confirm save');
	assert.equal(input.expectedRevision, 2);
	assert.equal(input._id, adminNotice._id);
	assert.equal(input.noticeCategory, undefined);
	assert.equal(input.memberId, undefined);
	assert.equal(input.noticeStatus, 'ACTIVE');
});
test('admin account access uses a narrow member status payload after confirmation', async () => {
	let input;
	await mountAdmin('/_admin/users', {}, (op) => {
		if (op.operationName === 'AdminMembers') return { getAllMembersByAdmin: collection([adminMember]) };
		input = op.variables.input;
		return {
			updateMemberByAdmin: {
				__typename: 'Member',
				_id: adminMember._id,
				memberType: 'HOTEL_OWNER',
				memberStatus: 'BLOCK',
			},
		};
	});
	await click('Block access');
	assert.equal(input, undefined);
	await click('Confirm change');
	assert.deepEqual(input, { _id: adminMember._id, memberStatus: 'BLOCK' });
});
