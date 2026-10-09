// Compatibility shape for old components; populated from the member API, never JWT claims.
export interface CustomJwtPayload {
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
	memberProperties: number;
	memberRank: number;
	memberArticles: number;
	memberPoints: number;
	memberLikes: number;
	memberViews: number;
	memberWarnings: number;
	memberBlocks: number;
}
