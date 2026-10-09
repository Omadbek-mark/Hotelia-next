import { initializeApollo } from '../../apollo/client';
import { userVar, anonymousUser } from '../../apollo/store';
import { GET_SESSION_MEMBER, LOGIN, LOGOUT, SIGN_UP } from '../../apollo/hotelia/auth';
import type { Member, MemberInput } from '../types/hotelia/contracts';
import { clearSession, getJwtToken, getValidAccessToken, readAccessClaims, saveSession } from './session';

export { getJwtToken } from './session';

// Transitional adapter for the existing pages. New screens use memberHotels directly.
export function applySessionMember(member: Member): void {
	userVar({
		_id: member._id,
		memberType: member.memberType,
		memberStatus: member.memberStatus,
		memberAuthType: member.memberAuthType,
		memberEmail: member.memberEmail,
		memberPhone: member.memberPhone || '',
		memberNick: member.memberNick,
		memberFullName: member.memberFullName || '',
		memberImage: member.memberImage || '',
		memberAddress: member.memberAddress || '',
		memberDesc: member.memberDesc || '',
		memberHotels: member.memberHotels,
		memberProperties: member.memberHotels,
		memberRank: member.memberRank,
		memberArticles: member.memberArticles,
		memberPoints: member.memberPoints,
		memberLikes: member.memberLikes,
		memberViews: member.memberViews,
		memberWarnings: member.memberWarnings,
		memberBlocks: member.memberBlocks,
	});
}

async function acceptSession(member?: Member | null): Promise<void> {
	if (!member?.accessToken || !member.refreshToken) throw new Error('Unable to sign in. Please try again.');
	saveSession({ accessToken: member.accessToken, refreshToken: member.refreshToken });
	await initializeApollo().clearStore();
	if (getJwtToken() !== member.accessToken) return;
	applySessionMember(member);
	window.localStorage.setItem('login', String(Date.now()));
}

export async function logIn(nick: string, password: string): Promise<void> {
	const { data } = await initializeApollo().mutate<{ login: Member }>({
		mutation: LOGIN,
		variables: { input: { memberNick: nick, memberPassword: password } },
		context: { skipAuth: true },
	});
	await acceptSession(data?.login);
}

export async function signUp(input: MemberInput): Promise<void> {
	const { data } = await initializeApollo().mutate<{ signup: Member }>({
		mutation: SIGN_UP, variables: { input }, context: { skipAuth: true },
	});
	await acceptSession(data?.signup);
}

let memberRequest: Promise<boolean> | null = null;

export async function updateUserInfo(_legacyToken?: string): Promise<boolean> {
	if (typeof window === 'undefined') return false;
	if (memberRequest) return memberRequest;
	memberRequest = (async () => {
		const token = await getValidAccessToken();
		const claims = readAccessClaims(token);
		if (!claims) { userVar({ ...anonymousUser }); return false; }
		try {
			const { data } = await initializeApollo().query<{ getMember: Member; checkAuth: string }>({
				query: GET_SESSION_MEMBER, variables: { memberId: claims.sub }, fetchPolicy: 'network-only',
			});
			if (getJwtToken() !== token) return false;
			applySessionMember(data.getMember);
			return true;
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : '';
			if (/not authenticated|unauthorized/i.test(message) && getJwtToken() === token) clearSession();
			return false;
		}
	})().catch(() => false).finally(() => { memberRequest = null; });
	return memberRequest;
}

export async function logOut(): Promise<void> {
	let token = getJwtToken();
	try { token = await getValidAccessToken(); } catch { /* Clear local credentials even when offline. */ }
	clearSession();
	userVar({ ...anonymousUser });
	const client = initializeApollo();
	await client.clearStore();
	if (token) {
		try {
			await client.mutate({ mutation: LOGOUT, context: { skipAuth: true, headers: { Authorization: `Bearer ${token}` } } });
		} catch { /* Local logout still works when the server is unavailable. */ }
	}
}
