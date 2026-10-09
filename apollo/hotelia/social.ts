import { gql } from '@apollo/client';
import type { Member } from '../../libs/types/hotelia/contracts';

export type PublicProfile = Pick<
	Member,
	| '_id'
	| 'memberNick'
	| 'memberFullName'
	| 'memberImage'
	| 'memberDesc'
	| 'memberType'
	| 'memberStatus'
	| 'memberHotels'
	| 'memberArticles'
	| 'memberFollowers'
	| 'memberFollowings'
	| 'createdAt'
	| 'meFollowed'
>;
const profile = gql`
	fragment SocialProfile on Member {
		_id
		memberNick
		memberFullName
		memberImage
		memberDesc
		memberType
		memberStatus
		memberHotels
		memberArticles
		memberFollowers
		memberFollowings
		createdAt
		meFollowed {
			followingId
			followerId
			myFollowing
		}
	}
`;
export const GET_HOST_DIRECTORY = gql`
	query HostDirectory($input: HotelOwnersInquiry!) {
		getHotelOwners(input: $input) {
			list {
				...SocialProfile
			}
			metaCounter {
				total
			}
		}
	}
	${profile}
`;
export const GET_PUBLIC_PROFILE = gql`
	query PublicMember($memberId: String!) {
		getMember(memberId: $memberId) {
			...SocialProfile
		}
	}
	${profile}
`;
export const GET_MEMBER_FOLLOWERS = gql`
	query MemberFollowers($input: FollowInquiry!) {
		getMemberFollowers(input: $input) {
			list {
				_id
				followerId
				followingId
				followerData {
					_id
					memberNick
					memberImage
					memberDesc
				}
				meFollowed {
					followerId
					followingId
					myFollowing
				}
			}
			metaCounter {
				total
			}
		}
	}
`;
export const GET_MEMBER_FOLLOWINGS = gql`
	query MemberFollowings($input: FollowInquiry!) {
		getMemberFollowings(input: $input) {
			list {
				_id
				followerId
				followingId
				followingData {
					_id
					memberNick
					memberImage
					memberDesc
				}
				meFollowed {
					followerId
					followingId
					myFollowing
				}
			}
			metaCounter {
				total
			}
		}
	}
`;
export const FOLLOW_MEMBER = gql`
	mutation FollowHoteliaMember($input: String!) {
		subscribe(input: $input) {
			_id
			followerId
			followingId
		}
	}
`;
export const UNFOLLOW_MEMBER = gql`
	mutation UnfollowHoteliaMember($input: String!) {
		unsubscribe(input: $input) {
			_id
			followerId
			followingId
		}
	}
`;
export const GET_PROFILE_ARTICLES = gql`
	query ProfileJournal($input: BoardArticlesInquiry!) {
		getBoardArticles(input: $input) {
			list {
				_id
				articleTitle
				articleImage
				createdAt
			}
			metaCounter {
				total
			}
		}
	}
`;
