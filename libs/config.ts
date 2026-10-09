export const REACT_APP_API_URL = (
	process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3021'
).replace(/\/+$/, '');

export const API_GRAPHQL_URL =
	process.env.NEXT_PUBLIC_API_GRAPHQL_URL || process.env.REACT_APP_API_GRAPHQL_URL || `${REACT_APP_API_URL}/graphql`;

export function getAssetUrl(path?: string | null, fallback = '/img/profile/defaultUser.svg'): string {
	if (!path) return fallback;
	if (/^https?:\/\//i.test(path)) return path;
	if (/^\/?uploads\//.test(path)) return `${REACT_APP_API_URL}/${path.replace(/^\/+/, '')}`;
	return path.startsWith('/') ? path : `/${path}`;
}

export const availableOptions = ['propertyBarter', 'propertyRent'];

const thisYear = new Date().getFullYear();

export const propertyYears: any = [];

for (let i = 1970; i <= thisYear; i++) {
	propertyYears.push(String(i));
}

export const propertySquare = [0, 25, 50, 75, 100, 125, 150, 200, 300, 500];

export const Messages = {
	error1: 'Something went wrong!',
	error2: 'Please login first!',
	error3: 'Please fulfill all inputs!',
	error4: 'Message is empty!',
	error5: 'Only images with jpeg, jpg, png format allowed!',
};

export const topPropertyRank = 2;
