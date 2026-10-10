import React, { ReactNode, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { Drawer, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { MemberType } from '../../types/hotelia/enums';

const links = [
	{ label: 'Home', href: '/' }, { label: 'Stays', href: '/property' },
	{ label: 'Hosts', href: '/agent' }, { label: 'Journal', href: '/community' },
	{ label: 'Saved', href: '/mypage?category=myFavorites' }, { label: 'Trips', href: '/mypage?category=myBookings' },
];

export function Brand() {
	return <Link className="h-brand" href="/" aria-label="Hotelia home"><span>Hotelia</span><small>Open Horizons</small></Link>;
}

export default function PublicLayout({ children, title = 'Open Horizons', legacyId }: {
	children: ReactNode; title?: string; legacyId?: string;
}) {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [open, setOpen] = useState(false);
	useEffect(() => { setOpen(false); }, [router.asPath]);
	const navigation = <>{links.map(({ label, href }) => <Link key={label} href={href}
		aria-current={router.asPath.split('#')[0] === href || (href.includes('?category=') && router.pathname === '/mypage' && router.query.category === href.split('?category=')[1]) || (href !== '/' && !href.includes('?') && router.pathname.startsWith(href)) ? 'page' : undefined}>{label}</Link>)}</>;
	return <div className="h-site">
		<Head><title>{title} · Hotelia</title><meta name="description" content="Find your next stay with Hotelia. Explore hotels, compare rooms and request a booking." /></Head>
		<a className="h-skip-link" href="#hotelia-main">Skip to content</a>
		<header className="h-header"><div className="h-container h-header-inner">
			<Brand /><nav className="h-desktop-nav" aria-label="Main navigation">{navigation}</nav>
			<div className="h-header-actions">
				{user.memberType === MemberType.HOTEL_OWNER && <Link className="h-owner-link" href="/owner">Host dashboard</Link>}
				{user.memberType === MemberType.ADMIN && <Link className="h-owner-link" href="/_admin">Admin</Link>}
				<Link className="h-account-link" href={user._id ? '/mypage?category=myProfile' : '/account/join'}>
					<span>{user._id ? user.memberNick : 'Account'}</span><PersonOutlineIcon fontSize="small" />
				</Link>
				<IconButton className="h-mobile-menu" aria-label="Open menu" onClick={() => setOpen(true)}><MenuIcon /></IconButton>
			</div>
		</div></header>
		<Drawer open={open} anchor="right" onClose={() => setOpen(false)}>
			<div className="h-mobile-drawer"><div className="h-drawer-top"><Brand /><IconButton aria-label="Close menu" onClick={() => setOpen(false)}><CloseIcon /></IconButton></div>
				<nav aria-label="Mobile navigation">{navigation}<Link href="/cs">Help</Link>
					{user.memberType === MemberType.HOTEL_OWNER && <Link href="/owner">Host dashboard</Link>}
					{user.memberType === MemberType.ADMIN && <Link href="/_admin">Admin dashboard</Link>}
				</nav>
				{user._id && <button className="h-plain-button" onClick={() => { void logOut(); setOpen(false); }}>Sign out</button>}
			</div>
		</Drawer>
		<main id="hotelia-main" className="h-main">{legacyId ? <div id={legacyId}>{children}</div> : children}</main>
		<footer className="h-footer"><div className="h-container h-footer-inner"><Brand />
			<nav aria-label="Footer navigation"><Link href="/property">Stays</Link><Link href="/agent">Hosts</Link><Link href="/community">Journal</Link><Link href="/about">About</Link><Link href="/cs">Help</Link></nav>
			<small>© {new Date().getFullYear()} Hotelia</small>
		</div></footer>
	</div>;
}
