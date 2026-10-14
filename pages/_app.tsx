import { ApolloProvider } from '@apollo/client';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import React, { useEffect } from 'react';
import { useApollo } from '../apollo/client';
import { anonymousUser, userVar } from '../apollo/store';
import { updateUserInfo } from '../libs/auth/index';
import PublicChat from '../libs/components/common/PublicChat';
import '../scss/app.scss';
import { hoteliaTheme } from '../scss/MaterialTheme/index';

const App = ({ Component, pageProps }: AppProps) => {
	const client = useApollo(pageProps.initialApolloState);
	useEffect(() => {
		const onLogout = () => {
			userVar({ ...anonymousUser });
			void client.clearStore();
		};
		const onStorage = (event: StorageEvent) => {
			if (event.key === 'logout') onLogout();
			if (event.key === 'login') {
				onLogout();
				void updateUserInfo();
			}
		};
		void updateUserInfo();
		window.addEventListener('storage', onStorage);
		window.addEventListener('hotelia:logout', onLogout);
		return () => {
			window.removeEventListener('storage', onStorage);
			window.removeEventListener('hotelia:logout', onLogout);
		};
	}, [client]);

	return (
		<ApolloProvider client={client}>
			<ThemeProvider theme={hoteliaTheme}>
				<CssBaseline />
				<Component {...pageProps} />
				<PublicChat />
			</ThemeProvider>
		</ApolloProvider>
	);
};

export default appWithTranslation(App, require('../next-i18next.config'));
