import { gql } from '@apollo/client';

export const SESSION_MEMBER_FIELDS = gql`
	fragment SessionMember on Member {
		_id memberNick memberEmail memberType memberStatus memberAuthType
		memberPhone memberFullName memberImage memberAddress memberDesc
		memberHotels memberRank memberArticles memberPoints memberLikes memberViews
		memberFollowers memberFollowings memberComments memberWarnings memberBlocks
	}
`;

export const LOGIN = gql`
	${SESSION_MEMBER_FIELDS}
	mutation Login($input: LoginInput!) {
		login(input: $input) { ...SessionMember accessToken refreshToken }
	}
`;

export const SIGN_UP = gql`
	${SESSION_MEMBER_FIELDS}
	mutation Signup($input: MemberInput!) {
		signup(input: $input) { ...SessionMember accessToken refreshToken }
	}
`;

export const GET_SESSION_MEMBER = gql`
	${SESSION_MEMBER_FIELDS}
	query GetSessionMember($memberId: String!) {
		checkAuth
		getMember(memberId: $memberId) { ...SessionMember }
	}
`;

export const LOGOUT = gql`mutation Logout { logout }`;

export const UPDATE_MEMBER = gql`
	${SESSION_MEMBER_FIELDS}
	mutation UpdateMember($input: MemberUpdate!) {
		updateMember(input: $input) { ...SessionMember }
	}
`;
