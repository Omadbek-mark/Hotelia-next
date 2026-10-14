/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	async redirects() {
		return [
			{
				source: '/mypage',
				has: [{ type: 'query', key: 'category', value: 'myProperties' }],
				destination: '/owner?tab=hotels',
				permanent: true,
			},
			{
				source: '/mypage',
				has: [{ type: 'query', key: 'category', value: 'addProperty' }],
				destination: '/owner/hotel',
				permanent: true,
			},
			{
				source: '/property/detail',
				has: [{ type: 'query', key: 'id', value: '(?<hotelId>[^/]+)' }],
				destination: '/hotel/detail?hotelId=:hotelId',
				permanent: true,
			},
			{
				source: '/agent/detail',
				has: [{ type: 'query', key: 'agentId', value: '(?<ownerId>[^/]+)' }],
				destination: '/hotel-owner/detail?ownerId=:ownerId',
				permanent: true,
			},
			{ source: '/property/:path*', destination: '/hotel/:path*', permanent: true },
			{ source: '/agent/:path*', destination: '/hotel-owner/:path*', permanent: true },
			{ source: '/community/:path*', destination: '/journal/:path*', permanent: true },
			{ source: '/mypage/:path*', destination: '/account/:path*', permanent: true },
			{ source: '/cs/:path*', destination: '/support/:path*', permanent: true },
			{ source: '/_admin/cs/:path*', destination: '/_admin/support/:path*', permanent: true },
			{ source: '/_admin/community', destination: '/_admin/journal', permanent: true },
			{ source: '/_admin/properties', destination: '/_admin/hotels', permanent: true },
		];
	},
	env: {
  REACT_APP_API_WS: process.env.REACT_APP_API_WS,
		REACT_APP_API_URL: process.env.REACT_APP_API_URL,
		REACT_APP_API_GRAPHQL_URL: process.env.REACT_APP_API_GRAPHQL_URL,
	},
};

const { i18n } = require('./next-i18next.config');
nextConfig.i18n = i18n;

// Keep production builds from replacing files used by the running dev server.
module.exports = (phase) => ({
	...nextConfig,
	distDir: phase === 'phase-development-server' ? '.next-dev' : '.next',
});
