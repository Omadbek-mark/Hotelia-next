import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { logOut } from '../../auth/index';
import { Button } from '../common/ui';

const navigation = [
	['My trips', 'myBookings'],
	['Saved stays', 'myFavorites'],
	['Recently viewed', 'recentlyVisited'],
	['My profile', 'myProfile'],
	['My journal', 'myArticles'],
	['Followers', 'followers'],
	['Following', 'followings'],
];

export default function AccountLayout({ children }: { children: ReactNode }) {
	const router = useRouter();
	return (
		<div className="h-container h-account-layout">
			<aside className="h-account-sidebar">
				<span className="h-eyebrow">Your Hotelia</span>
				<nav aria-label="Account navigation">
					{navigation.map(([label, category]) => (
						<Link
							key={category}
							href={`/account?category=${category}`}
							aria-current={(router.query.category || 'myProfile') === category ? 'page' : undefined}
						>
							{label}
						</Link>
					))}
				</nav>
				<Button
					variant="text"
					onClick={() => {
						void logOut();
					}}
				>
					Sign out
				</Button>
			</aside>
			<div className="h-account-content">{children}</div>
		</div>
	);
}
