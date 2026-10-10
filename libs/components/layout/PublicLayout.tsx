import NotificationLink from '../common/NotificationLink';
import PublicFooter from './PublicFooter';
import { useReactiveVar } from '@apollo/client';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { Drawer, IconButton } from '@mui/material';
import Head from 'next/head';
import Link from 'next/link';
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
	{ label: 'Saved', href: '/account?category=myFavorites' },
	{ label: 'Trips', href: '/account?category=myBookings' },
];

export function Brand() {
	return (
		<Link className="h-brand" href="/" aria-label="Hotelia home">
			<span>Hotelia</span>
			<small>Open Horizons</small>
		</Link>
	);
}

export default function PublicLayout({ children, title = 'Open Horizons' }: { children: ReactNode; title?: string }) {
	const router = useRouter();
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
	}, [router.asPath]);
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
					{label}
				</Link>
			))}
		</>
	);
	return (
		<div className={`h-site${router.pathname === '/' ? ' h-site--home' : ''}`} id="hotelia-top">
			<Head>
				<title>{title} · Hotelia</title>
				<meta
					name="description"
					content="Find your next stay with Hotelia. Explore hotels, compare rooms and request a booking."
				/>
			</Head>
			<a className="h-skip-link" href="#hotelia-main">
				Skip to content
			</a>
			<header className={`h-header${scrolled ? ' h-header--scrolled' : ''}`}>
				<div className="h-container h-header-inner">
					<Brand />
					<nav className="h-desktop-nav" aria-label="Main navigation">
						{navigation}
					</nav>
					<div className="h-header-actions">
						<NotificationLink />
						{user.memberType === MemberType.HOTEL_OWNER && (
							<Link className="h-owner-link" href="/owner">
								Host dashboard
							</Link>
						)}
						{user.memberType === MemberType.ADMIN && (
							<Link className="h-owner-link" href="/_admin">
								Admin
							</Link>
						)}
						<Link
							className="h-account-link"
							aria-label={user._id ? user.memberNick : 'Account'}
							href={user._id ? '/account?category=myProfile' : '/account/join'}
						>
							<span>{user._id ? user.memberNick : 'Account'}</span>
							<PersonOutlineIcon fontSize="small" />
						</Link>
						<IconButton
							className="h-mobile-menu"
							aria-label="Open menu"
							aria-expanded={open}
							aria-controls={open ? 'hotelia-mobile-navigation' : undefined}
							onClick={() => setOpen(true)}
						>
							<MenuIcon />
						</IconButton>
					</div>
				</div>
			</header>
			<Drawer open={open} anchor="right" onClose={() => setOpen(false)}>
				<div className="h-mobile-drawer">
					<div className="h-drawer-top">
						<Brand />
						<IconButton aria-label="Close menu" onClick={() => setOpen(false)}>
							<CloseIcon />
						</IconButton>
					</div>
					<nav id="hotelia-mobile-navigation" aria-label="Mobile navigation">
						{navigation}
						<Link href="/support">Help</Link>
						{user.memberType === MemberType.HOTEL_OWNER && <Link href="/owner">Host dashboard</Link>}
						{user.memberType === MemberType.ADMIN && <Link href="/_admin">Admin dashboard</Link>}
					</nav>
					{user._id && (
						<button
							className="h-plain-button"
							onClick={() => {
								void logOut();
								setOpen(false);
							}}
						>
							Sign out
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
