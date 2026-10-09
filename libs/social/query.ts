import type { HotelOwnersInquiry, MeFollowed } from '../types/hotelia/contracts';
import { Direction } from '../types/hotelia/enums';
import type { SearchQuery } from '../search/hotel-search';

export const isMemberId = (value: unknown): value is string =>
	typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
export function socialHref(pathname: string, query: SearchQuery) {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
		else if (value !== undefined) params.set(key, value);
	}
	return `${pathname}?${params.toString()}`;
}
export function socialPage(value: unknown): number | undefined {
	if (value === undefined) return 1;
	if (typeof value !== 'string' || !/^\d+$/.test(value)) return undefined;
	const page = Number(value);
	return Number.isInteger(page) && page >= 1 && page <= 1000000 ? page : undefined;
}
export const hostSorts = { memberRank: 'Top hosts', memberFollowers: 'Most followed', createdAt: 'Newest hosts' };
export function parseHostQuery(query: SearchQuery) {
	const page = socialPage(query.page),
		sort = query.sort ?? 'memberRank',
		text = query.text ?? '';
	const input: HotelOwnersInquiry = {
		page: page || 1,
		limit: 6,
		sort: 'memberRank',
		direction: Direction.DESC,
		search: {},
	};
	if (
		!page ||
		typeof sort !== 'string' ||
		!Object.prototype.hasOwnProperty.call(hostSorts, sort) ||
		typeof text !== 'string' ||
		text.length > 100
	)
		return { input, error: 'Choose a valid host search.' };
	input.sort = sort;
	input.search = text.trim() ? { text: text.trim() } : {};
	return { input };
}
export function isFollowing(records: MeFollowed[] | null | undefined, viewerId: string, targetId: string) {
	return (
		!!viewerId &&
		!!records?.some((record) => record.followerId === viewerId && record.followingId === targetId && record.myFollowing)
	);
}
