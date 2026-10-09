import decodeJWT, { JwtPayload } from 'jwt-decode';
import { API_GRAPHQL_URL } from '../config';
import type { TokenPair } from '../types/hotelia/contracts';

interface AccessClaims extends JwtPayload {
	sub: string;
	sid: string;
	type: 'access';
}

export function readAccessClaims(token: string): AccessClaims | null {
	try {
		const claims = decodeJWT<AccessClaims>(token);
		return claims.type === 'access' && /^[a-f\d]{24}$/i.test(claims.sub) &&
			/^[a-f\d]{24}$/i.test(claims.sid) && typeof claims.exp === 'number' ? claims : null;
	} catch {
		return null;
	}
}

export function getJwtToken(): string {
	return typeof window === 'undefined' ? '' : window.localStorage.getItem('accessToken') || '';
}

export function clearSession(): void {
	if (typeof window === 'undefined') return;
	window.localStorage.removeItem('accessToken');
	window.localStorage.removeItem('refreshToken');
	window.localStorage.setItem('logout', String(Date.now()));
	window.dispatchEvent(new Event('hotelia:logout'));
}

export function saveSession(tokens: TokenPair): void {
	if (!readAccessClaims(tokens.accessToken) || !tokens.refreshToken) throw new Error('Invalid session response');
	window.localStorage.setItem('accessToken', tokens.accessToken);
	window.localStorage.setItem('refreshToken', tokens.refreshToken);
}

let refreshRequest: Promise<string> | null = null;

export async function getValidAccessToken(): Promise<string> {
	if (typeof window === 'undefined') return '';
	const token = getJwtToken();
	const claims = readAccessClaims(token);
	if (claims && claims.exp! * 1000 > Date.now() + 30_000) return token;
	const refreshToken = window.localStorage.getItem('refreshToken');
	if (!refreshToken) {
		if (token) clearSession();
		return '';
	}
	// One rotation per browser tab, including concurrent queries and uploads.
	if (refreshRequest) return refreshRequest;
	refreshRequest = (async () => {
		const response = await fetch(API_GRAPHQL_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: 'mutation RefreshSession($token: String!) { refreshToken(token: $token) { accessToken refreshToken } }',
				variables: { token: refreshToken },
			}),
		});
		if (window.localStorage.getItem('refreshToken') !== refreshToken) return getJwtToken();
		if (response.status === 401 || response.status === 403) { clearSession(); return ''; }
		const result = await response.json();
		if (result.errors?.some((error: { message: string; extensions?: { code?: string } }) =>
			['UNAUTHENTICATED', 'UNAUTHORIZED'].includes(error.extensions?.code || '') || /not authenticated|unauthorized/i.test(error.message))) {
			clearSession();
			return '';
		}
		if (!response.ok || result.errors?.length || !result.data?.refreshToken) throw new Error('Unable to restore session. Please try again.');
		saveSession(result.data.refreshToken);
		return result.data.refreshToken.accessToken;
	})().finally(() => { refreshRequest = null; });
	return refreshRequest;
}
