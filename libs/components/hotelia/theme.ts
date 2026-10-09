import { createTheme } from '@mui/material/styles';

export const hoteliaTheme = createTheme({
	palette: {
		primary: { main: '#1a2e26', contrastText: '#fff' },
		secondary: { main: '#a13f24', contrastText: '#fff' },
		background: { default: '#fcf9f4', paper: '#fff' },
		text: { primary: '#1c1c19', secondary: '#626960' },
		divider: '#e5e2dd',
	},
	shape: { borderRadius: 8 },
	typography: {
		fontFamily: '"Hanken Grotesk", Arial, sans-serif',
		h1: { fontFamily: '"Newsreader", Georgia, serif', fontWeight: 400 },
		h2: { fontFamily: '"Newsreader", Georgia, serif', fontWeight: 400 },
		h3: { fontFamily: '"Newsreader", Georgia, serif', fontWeight: 400 },
		button: { textTransform: 'none', fontWeight: 600 },
	},
	components: {
		MuiCssBaseline: { styleOverrides: { body: { backgroundColor: '#fcf9f4' } } },
		MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 44, padding: '10px 20px' } } },
		MuiOutlinedInput: { styleOverrides: { root: { background: '#fff' } } },
		MuiDialog: { defaultProps: { fullWidth: true, maxWidth: 'sm' } },
	},
});
