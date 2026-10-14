export const supportTabs = ['faq', 'notices', 'inquiries', 'notifications'] as const;
export const guides = [
	{
		topic: 'Booking',
		title: 'How does booking work?',
		content:
			'Choose your dates and a room, then send a booking request. The hotel owner confirms your request. Follow its status in My trips.',
	},
	{
		topic: 'Booking',
		title: 'Can I cancel my stay?',
		content:
			'Open My trips and select your booking. Pending and confirmed bookings can be cancelled; completed bookings cannot.',
	},
	{
		topic: 'Booking',
		title: 'How do I find available rooms?',
		content:
			'Search with arrival, departure, guest count and room quantity. Availability is checked for every night of your stay.',
	},
	{
		topic: 'Reviews',
		title: 'When can I write a review?',
		content: 'After a completed stay, open My trips to leave one review for that booking, with a rating from 1 to 5.',
	},
	{
		topic: 'Account',
		title: 'Where are my saved hotels?',
		content: 'Log in and open Saved. Recently viewed hotels are available in your account too.',
	},
	{
		topic: 'Hosting',
		title: 'Where do I manage my hotel?',
		content: 'Hotel owners use the Host workspace to manage hotels, room inventory and reservations.',
	},
	{
		topic: 'Booking',
		title: 'Does Hotelia collect payment?',
		content:
			'This booking flow does not collect payment. Confirm payment arrangements with the hotel. The confirmed booking shows the server’s final USD total.',
	},
];
export function inquiryInput(title: string, content: string, requestId: string) {
	const noticeTitle = title.trim(),
		noticeContent = content.trim();
	if (noticeTitle.length < 3 || noticeTitle.length > 100) return { error: 'Use 3–100 characters for the subject.' };
	if (noticeContent.length < 10 || noticeContent.length > 2000)
		return { error: 'Use 10–2,000 characters for your message.' };
	if (!/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(requestId))
		return { error: 'Reload this page before sending your message.' };
	return { input: { noticeTitle, noticeContent, requestId } };
}
