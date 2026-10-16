import LanguageIcon from '@mui/icons-material/Language';
import { useHoteliaTranslation } from '../../hooks/useHoteliaTranslation';
import NotificationLink from '../common/NotificationLink';
import PublicFooter from './PublicFooter';
import { useReactiveVar } from '@apollo/client';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { Drawer, IconButton, Menu, MenuItem } from '@mui/material';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { ReactNode, useEffect, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { logOut } from '../../auth/index';
import { MemberType } from '../../enums';

const links = [
	{ label: 'Home', href: '/' },
	{ label: 'Stays', href: '/hotel' },
	{ label: 'Hosts', href: '/hotel-owner' },
	{ label: 'Journal', href: '/journal' },
	{ label: 'About us', href: '/about' },
];

export function Brand() {
	return (
		<Link className="h-brand" href="/" aria-label="Hotelia home">
			<Image
				className="h-brand-logo"
				src="/img/hotelia/hotelia-logo-v1.png"
				alt=""
				aria-hidden="true"
				width={48}
				height={48}
			/>
			<div className="h-brand-copy">
				<span>Hotelia</span>
				<small>Open Horizons</small>
			</div>
		</Link>
	);
}

export default function PublicLayout({ children, title = 'Open Horizons' }: { children: ReactNode; title?: string }) {
	const router = useRouter();
	const tr = useHoteliaTranslation();
	const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);
	const [languageAnchor, setLanguageAnchor] = useState<HTMLElement | null>(null);
	const [changingLanguage, setChangingLanguage] = useState(false);
	const [languageError, setLanguageError] = useState('');
	const user = useReactiveVar(userVar);
	const [open, setOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	useEffect(() => {
		const update = () => setScrolled(window.scrollY >= 50);
		update();
		window.addEventListener('scroll', update, { passive: true });
		return () => window.removeEventListener('scroll', update);
	}, []);
	useEffect(() => {
		setOpen(false);
		setAccountAnchor(null);
		setLanguageAnchor(null);
	}, [router.asPath, router.locale, user._id, user.memberType]);
	const navigation = (
		<>
			{links.map(({ label, href }) => (
				<Link
					key={label}
					href={href}
					aria-current={
						router.asPath.split('#')[0] === href ||
						(href.includes('?category=') &&
							router.pathname === '/account' &&
							router.query.category === href.split('?category=')[1]) ||
						(href !== '/' &&
							!href.includes('?') &&
							(router.pathname === href || router.pathname.startsWith(`${href}/`)))
							? 'page'
							: undefined
					}
				>
					{tr(label)}
				</Link>
			))}
		</>
	);
	return (
		<div className={`h-site${router.pathname === '/' ? ' h-site--home' : ''}`} id="hotelia-top">
			<Head>
				<title>{tr(title)} · Hotelia</title>
				<meta
					name="description"
					content="Find your next stay with Hotelia. Explore hotels, compare rooms and request a booking."
				/>
			</Head>
			<a className="h-skip-link" href="#hotelia-main">
				{tr('Skip to content')}
			</a>
			<header className={`h-header${scrolled ? ' h-header--scrolled' : ''}`}>
				<div className="h-container h-header-inner">
					<Brand />
					<nav className="h-desktop-nav" aria-label={tr('Main navigation')}>
						{navigation}
					</nav>
					<div className="h-header-actions">
						<NotificationLink />
						<button
							className="h-language-button"
							type="button"
							aria-label={tr('Choose language')}
							aria-haspopup="menu"
							aria-expanded={!!languageAnchor}
							aria-controls={languageAnchor ? 'hotelia-language-menu' : undefined}
							onClick={(event) => setLanguageAnchor(event.currentTarget)}
							disabled={changingLanguage}
						>
							<LanguageIcon fontSize="small" />
							<span>{(router.locale || 'en').toUpperCase()}</span>
						</button>
						{user._id ? (
							<button
								type="button"
								className="h-account-link"
								aria-label={user.memberNick}
								aria-haspopup="menu"
								aria-expanded={!!accountAnchor}
								aria-controls={accountAnchor ? 'hotelia-account-menu' : undefined}
								onClick={(event) => setAccountAnchor(event.currentTarget)}
							>
								<span>{user.memberNick}</span>
								<PersonOutlineIcon fontSize="small" />
							</button>
						) : (
							<Link
								className="h-account-link"
								aria-label={user._id ? user.memberNick : tr('Account')}
								href={user._id ? '/account?category=myProfile' : '/account/join'}
							>
								<span>{user._id ? user.memberNick : tr('Account')}</span>
								<PersonOutlineIcon fontSize="small" />
							</Link>
						)}
						<IconButton
							className="h-mobile-menu"
							aria-label={tr('Open menu')}
							aria-expanded={open}
							aria-controls={open ? 'hotelia-mobile-navigation' : undefined}
							onClick={() => setOpen(true)}
						>
							<MenuIcon />
						</IconButton>
					</div>
				</div>
			</header>
			<Menu
				id="hotelia-account-menu"
				anchorEl={accountAnchor}
				open={!!accountAnchor && !!user._id}
				onClose={() => setAccountAnchor(null)}
				PaperProps={{ className: 'h-navbar-menu' }}
			>
				<MenuItem component={Link} href="/account?category=myProfile" onClick={() => setAccountAnchor(null)}>
					{tr('My profile')}
				</MenuItem>
				{(user.memberType === MemberType.HOTEL_OWNER || user.memberType === MemberType.ADMIN) && (
					<MenuItem
						component={Link}
						href={user.memberType === MemberType.ADMIN ? '/_admin' : '/owner'}
						onClick={() => setAccountAnchor(null)}
					>
						{tr('Dashboard')}
					</MenuItem>
				)}
				<MenuItem
					onClick={() => {
						setAccountAnchor(null);
						void logOut();
					}}
					divider
				>
					{tr('Log out')}
				</MenuItem>
			</Menu>
			<Menu
				id="hotelia-language-menu"
				anchorEl={languageAnchor}
				open={!!languageAnchor}
				onClose={() => setLanguageAnchor(null)}
				PaperProps={{ className: 'h-navbar-menu' }}
			>
				{[
					{ code: 'en', label: 'EN · English' },
					{ code: 'ru', label: 'RU · Русский' },
					{ code: 'uz', label: 'UZ · O‘zbekcha' },
					{ code: 'kr', label: 'KR · 한국어' },
				].map(({ code, label }) => (
					<MenuItem
						key={code}
						selected={(router.locale || 'en') === code}
						disabled={changingLanguage}
						onClick={async () => {
							setChangingLanguage(true);
							setLanguageError('');
							try {
								await router.push({ pathname: router.pathname, query: router.query }, router.asPath, {
									locale: code,
									scroll: false,
								});
								document.cookie = `NEXT_LOCALE=${code}; Path=/; Max-Age=31536000; SameSite=Lax`;
								setLanguageAnchor(null);
							} catch {
								setLanguageError(tr('Could not change language. Try again.'));
							} finally {
								setChangingLanguage(false);
							}
						}}
					>
						{label}
					</MenuItem>
				))}
				{languageError && (
					<p role="alert" className="h-language-error">
						{languageError}
					</p>
				)}
			</Menu>
			<Drawer open={open} anchor="right" onClose={() => setOpen(false)}>
				<div className="h-mobile-drawer">
					<div className="h-drawer-top">
						<Brand />
						<IconButton aria-label={tr('Close menu')} onClick={() => setOpen(false)}>
							<CloseIcon />
						</IconButton>
					</div>
					<nav id="hotelia-mobile-navigation" aria-label={tr('Mobile navigation')}>
						{navigation}
						<Link href="/support">{tr('Help')}</Link>
					</nav>
					{user._id && (
						<button
							className="h-plain-button"
							onClick={() => {
								void logOut();
								setOpen(false);
							}}
						>
							{tr('Log out')}
						</button>
					)}
				</div>
			</Drawer>
			<main id="hotelia-main" className="h-main" tabIndex={-1}>
				{children}
			</main>
			<PublicFooter />
		</div>
	);
}
