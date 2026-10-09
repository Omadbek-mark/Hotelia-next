import type { AppProps } from 'next/app';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useEffect } from 'react';
import { hoteliaTheme } from '../libs/components/hotelia/theme';
import { ApolloProvider } from '@apollo/client';
import { useApollo } from '../apollo/client';
import { appWithTranslation } from 'next-i18next';
import '../scss/app.scss';
import '../scss/pc/main.scss';
import '../scss/mobile/main.scss';
import '../scss/hotelia.scss';
import { updateUserInfo } from '../libs/auth';
import { anonymousUser, userVar } from '../apollo/store';

const App = ({ Component, pageProps }: AppProps) => {
	const client = useApollo(pageProps.initialApolloState);
	useEffect(() => {
		const onLogout = () => { userVar({ ...anonymousUser }); void client.clearStore(); };
		const onStorage = (event: StorageEvent) => {
			if (event.key === 'logout') onLogout();
			if (event.key === 'login') { onLogout(); void updateUserInfo(); }
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
			</ThemeProvider>
		</ApolloProvider>
	);
};

export default appWithTranslation(App);
