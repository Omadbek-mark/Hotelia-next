import {
	BoardArticleStatus,
	BookingStatus,
	HotelStatus,
	MemberStatus,
	MemberType,
	NoticeCategory,
	NoticeStatus,
	RoomStatus,
} from '../enums';
export const adminSections = [
	'overview',
	'hotels',
	'users',
	'journal',
	'rooms',
	'bookings',
	'faq',
	'notice',
	'inquiry',
] as const;
export type AdminSection = typeof adminSections[number];
export const labels: Record<string, string> = {
	ACTIVE: 'Active',
	PAUSED: 'Paused',
	DELETE: 'Archived',
	BLOCK: 'Blocked',
	HOLD: 'Draft',
	USER: 'Guest',
	HOTEL_OWNER: 'Hotel owner',
	ADMIN: 'Administrator',
	PENDING: 'Pending',
	CONFIRMED: 'Confirmed',
	COMPLETED: 'Completed',
	CANCELLED: 'Cancelled',
	FAQ: 'FAQ',
	ANNOUNCEMENT: 'Announcement',
	TERMS: 'Policy',
	INQUIRY: 'Inquiry',
};
export const label = (value: string) => labels[value] || value.toLowerCase().replace(/_/g, ' ');
export const statuses: Record<AdminSection, string[]> = {
	overview: [],
	hotels: Object.values(HotelStatus),
	rooms: Object.values(RoomStatus),
	users: Object.values(MemberStatus),
	journal: Object.values(BoardArticleStatus),
	bookings: Object.values(BookingStatus),
	faq: Object.values(NoticeStatus),
	notice: Object.values(NoticeStatus),
	inquiry: [NoticeStatus.HOLD, NoticeStatus.ACTIVE],
};
export function parseAdminFilters(section: AdminSection, query: Record<string, unknown>) {
	let valid = true;
	const scalar = (key: string) => {
		const value = query[key];
		if (value === undefined) return '';
		if (typeof value !== 'string') {
			valid = false;
			return '';
		}
		return value;
	};
	const rawPage = scalar('page'),
		page = rawPage ? Number(rawPage) : 1;
	if ((rawPage && !/^\d+$/.test(rawPage)) || !Number.isInteger(page) || page < 1 || page > 1000000) valid = false;
	const status = scalar('status'),
		text = scalar('text').trim(),
		type = scalar('type'),
		category = scalar('category'),
		hotelId = scalar('hotelId');
	if ((status && !statuses[section].includes(status)) || text.length > 100) valid = false;
	if (type && (section !== 'users' || !Object.values(MemberType).includes(type as MemberType))) valid = false;
	if (category && (section !== 'notice' || !['ANNOUNCEMENT', 'TERMS'].includes(category))) valid = false;
	if (hotelId && (!['rooms', 'bookings'].includes(section) || !/^[a-f\d]{24}$/i.test(hotelId))) valid = false;
	if (text && !['hotels', 'users'].includes(section)) valid = false;
	return { valid, page, status, text, type, category, hotelId };
}
export const noticeCategory = (section: AdminSection, category: string) =>
	section === 'faq'
		? NoticeCategory.FAQ
		: section === 'inquiry'
		? NoticeCategory.INQUIRY
		: category === 'TERMS'
		? NoticeCategory.TERMS
		: NoticeCategory.ANNOUNCEMENT;
export function publicNoticeInput(title: string, content: string) {
	const noticeTitle = title.trim(),
		noticeContent = content.trim();
	if (noticeTitle.length < 3 || noticeTitle.length > 100 || noticeContent.length < 10 || noticeContent.length > 2000)
		return null;
	return { noticeTitle, noticeContent };
}
