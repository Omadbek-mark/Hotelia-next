export const REACT_APP_API_URL = (
	process.env.NEXT_PUBLIC_API_URL ||
	process.env.REACT_APP_API_URL ||
	'http://localhost:3021'
).replace(/\/+$/, '');

export const API_GRAPHQL_URL =
	process.env.NEXT_PUBLIC_API_GRAPHQL_URL || process.env.REACT_APP_API_GRAPHQL_URL || `${REACT_APP_API_URL}/graphql`;

export function getAssetUrl(path?: string | null, fallback = '/img/profile/defaultUser.svg'): string {
	if (!path) return fallback;
	if (/^https?:\/\//i.test(path)) return path;
	if (/^\/?uploads\//.test(path)) return `${REACT_APP_API_URL}/${path.replace(/^\/+/, '')}`;
	return path.startsWith('/') ? path : `/${path}`;
}
