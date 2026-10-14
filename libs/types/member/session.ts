// Public session state populated from the member API, never from JWT claims.
export interface SessionMember {
	_id: string;
	memberType: string;
	memberStatus: string;
	memberAuthType: string;
	memberEmail?: string;
	memberHotels?: number;
	memberPhone: string;
	memberNick: string;
	memberFullName?: string;
	memberImage?: string;
	memberAddress?: string;
	memberDesc?: string;
	memberRank: number;
	memberArticles: number;
	memberPoints: number;
	memberLikes: number;
	memberFollowers: number;
	memberFollowings: number;
	memberViews: number;
	memberWarnings: number;
	memberBlocks: number;
}
