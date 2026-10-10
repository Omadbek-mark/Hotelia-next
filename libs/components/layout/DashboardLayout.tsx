import { useReactiveVar } from '@apollo/client';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import { Drawer, IconButton } from '@mui/material';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { ReactNode, useEffect, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { logOut, updateUserInfo } from '../../auth/index';
import { MemberType } from '../../enums';
import { Button, EmptyState } from '../common/ui';
import { Brand } from './PublicLayout';

export interface DashboardNavItem {
	label: string;
	href: string;
}

export default function DashboardLayout({
	children,
	title,
	role,
	navigation,
}: {
	children: ReactNode;
	title: string;
	role: MemberType;
	navigation: DashboardNavItem[];
}) {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [ready, setReady] = useState(false);
	const [open, setOpen] = useState(false);
	useEffect(() => {
		let active = true;
		void updateUserInfo().finally(() => {
			if (active) setReady(true);
		});
		return () => {
			active = false;
		};
	}, []);
	useEffect(() => {
		setOpen(false);
	}, [router.asPath]);
	if (!ready)
		return (
			<div className="h-site h-dashboard-loading" role="status">
				Opening dashboard…
			</div>
		);
	if (!user._id || user.memberType !== role)
		return (
			<div className="h-site">
				<EmptyState
					title={user._id ? 'Access restricted' : 'Sign in to continue'}
					description={
						user._id ? 'This dashboard is available to the appropriate account role.' : 'Your session may have expired.'
					}
					action={
						<Link
							className="h-text-link"
							href={user._id ? '/' : `/account/join?referrer=${encodeURIComponent(router.asPath)}`}
						>
							{user._id ? 'Back to stays' : 'Sign in'}
						</Link>
					}
				/>
			</div>
		);
	const sidebar = (
		<div className="h-dashboard-sidebar-content">
			<Brand />
			<span className="h-eyebrow">{role === MemberType.ADMIN ? 'Administration' : 'Host workspace'}</span>
			<nav aria-label="Dashboard navigation">
				{navigation.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						aria-current={
							(router.pathname === '/owner'
								? `/owner${router.query.tab && router.query.tab !== 'overview' ? `?tab=${router.query.tab}` : ''}`
								: router.pathname) === item.href
								? 'page'
								: undefined
						}
					>
						{item.label}
					</Link>
				))}
			</nav>
			<Link className="h-text-link" href="/">
				<ArrowBackIcon fontSize="small" />
				Back to stays
			</Link>
			<Button
				variant="text"
				onClick={() => {
					void logOut();
				}}
			>
				Sign out
			</Button>
		</div>
	);
	return (
		<div className="h-site h-dashboard">
			<Head>
				<title>{title} · Hotelia</title>
			</Head>
			<aside className="h-dashboard-sidebar">{sidebar}</aside>
			<Drawer open={open} onClose={() => setOpen(false)}>
				<IconButton aria-label="Close dashboard menu" onClick={() => setOpen(false)}>
					<CloseIcon />
				</IconButton>
				{sidebar}
			</Drawer>
			<div className="h-dashboard-workspace">
				<header className="h-dashboard-topbar">
					<div>
						<IconButton className="h-mobile-menu" aria-label="Open dashboard menu" onClick={() => setOpen(true)}>
							<MenuIcon />
						</IconButton>
						<span>{title}</span>
					</div>
					<Link href="/account?category=myProfile">{user.memberNick}</Link>
				</header>
				<main className="h-dashboard-main">{children}</main>
			</div>
		</div>
	);
}

export const ownerNavigation: DashboardNavItem[] = [
	{ label: 'Overview', href: '/owner' },
	{ label: 'My hotels', href: '/owner?tab=hotels' },
	{ label: 'Room inventory', href: '/owner?tab=rooms' },
	{ label: 'Reservations', href: '/owner?tab=bookings' },
	{ label: 'Add hotel', href: '/owner/hotel' },
];

export const adminNavigation: DashboardNavItem[] = [
	{ label: 'Overview', href: '/_admin' },
	{ label: 'Hotels', href: '/_admin/hotels' },
	{ label: 'Members', href: '/_admin/users' },
	{ label: 'Journal', href: '/_admin/journal' },
	{ label: 'FAQ', href: '/_admin/support/faq' },
	{ label: 'Notices', href: '/_admin/support/notice' },
	{ label: 'Inquiries', href: '/_admin/support/inquiry' },
];
