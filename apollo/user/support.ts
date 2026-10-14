import { gql } from '@apollo/client';
export const SUPPORT_FIELDS = gql`
	fragment SupportFields on SupportNotice {
		_id
		noticeCategory
		noticeStatus
		noticeTitle
		noticeContent
		noticeResponse
		respondedAt
		createdAt
		updatedAt
	}
`;
export const GET_SUPPORT_NOTICES = gql`
	query SupportNotices($input: SupportNoticesInquiry!) {
		getSupportNotices(input: $input) {
			list {
				...SupportFields
			}
			metaCounter {
				total
			}
		}
	}
	${SUPPORT_FIELDS}
`;
export const GET_MY_INQUIRIES = gql`
	query MySupportInquiries($input: MyInquiriesInquiry!) {
		getMyInquiries(input: $input) {
			list {
				...SupportFields
			}
			metaCounter {
				total
			}
		}
	}
	${SUPPORT_FIELDS}
`;
export const CREATE_SUPPORT_INQUIRY = gql`
	mutation SendSupportInquiry($input: SupportInquiryInput!) {
		createSupportInquiry(input: $input) {
			...SupportFields
		}
	}
	${SUPPORT_FIELDS}
`;
export const GET_NOTIFICATIONS = gql`
	query SupportNotifications($input: NotificationsInquiry!) {
		getMyNotifications(input: $input) {
			list {
				_id
				notificationType
				notificationStatus
				notificationGroup
				notificationTitle
				notificationDesc
				hotelId
				bookingId
				roomId
				inquiryId
				createdAt
				updatedAt
			}
			metaCounter {
				total
			}
		}
	}
`;
export const GET_UNREAD_COUNT = gql`
	query SupportUnreadCount {
		getUnreadNotificationCount
	}
`;
export const GET_UNREAD_COUNTS = gql`
	query SupportUnreadCounts {
		getUnreadNotificationCounts {
			notificationType
			total
		}
	}
`;
export const MARK_NOTIFICATION_READ = gql`
	mutation ReadSupportNotification($notificationId: String!) {
		markNotificationRead(notificationId: $notificationId) {
			_id
			notificationStatus
			updatedAt
		}
	}
`;
