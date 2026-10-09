import { useMemo } from 'react';
import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
import { API_GRAPHQL_URL } from '../libs/config';
import { getValidAccessToken } from '../libs/auth/session';

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined;

function createApolloClient() {
	const authLink = setContext(async (_, { headers = {}, skipAuth = false }) => {
		const token = skipAuth ? '' : await getValidAccessToken();
		return { headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) } };
	});
	const uploadLink = createUploadLink({
		uri: API_GRAPHQL_URL,
		headers: { 'apollo-require-preflight': 'true' },
	});
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: authLink.concat(uploadLink),
		cache: new InMemoryCache(),
	});
}

export function initializeApollo(initialState?: NormalizedCacheObject | null) {
	const client = apolloClient ?? createApolloClient();
	if (initialState) client.cache.restore(initialState);
	if (typeof window === 'undefined') return client;
	if (!apolloClient) apolloClient = client;
	return client;
}

export function useApollo(initialState?: NormalizedCacheObject) {
	return useMemo(() => initializeApollo(initialState), [initialState]);
}
