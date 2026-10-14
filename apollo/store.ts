import { makeVar } from '@apollo/client';
import { SessionMember } from '../libs/types/member/session';

export const anonymousUser: SessionMember = {
	_id: '',
	memberType: '',
	memberStatus: '',
	memberAuthType: '',
	memberEmail: '',
	memberHotels: 0,
	memberPhone: '',
	memberNick: '',
	memberFullName: '',
	memberImage: '',
	memberAddress: '',
	memberDesc: '',
	memberRank: 0,
	memberArticles: 0,
	memberPoints: 0,
	memberLikes: 0,
	memberFollowers: 0,
	memberFollowings: 0,
	memberViews: 0,
	memberWarnings: 0,
	memberBlocks: 0,
};

export const userVar = makeVar<SessionMember>({ ...anonymousUser });
