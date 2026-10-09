import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { light } from '../scss/MaterialTheme';
import { ApolloProvider } from '@apollo/client';
import { useApollo } from '../apollo/client';
import { appWithTranslation } from 'next-i18next';
import '../scss/app.scss';
import '../scss/pc/main.scss';
import '../scss/mobile/main.scss';
import { updateUserInfo } from '../libs/auth';
import { anonymousUser, userVar } from '../apollo/store';

const App = ({ Component, pageProps }: AppProps) => {
	// @ts-ignore
	const [theme, setTheme] = useState(createTheme(light));
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
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Component {...pageProps} />
			</ThemeProvider>
		</ApolloProvider>
	);
};

export default appWithTranslation(App);
