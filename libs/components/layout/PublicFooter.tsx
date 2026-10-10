import { useReactiveVar } from '@apollo/client';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import Link from 'next/link';
import { userVar } from '../../../apollo/store';
import { MemberType } from '../../enums';
import { Brand } from './PublicLayout';

export default function PublicFooter() {
	const user = useReactiveVar(userVar);
	return (
		<footer className="h-footer">
			<div className="h-container h-footer-inner">
				<div className="h-footer-intro">
					<Brand />
					<p>
						A little farther.
						<br />A little closer.
					</p>
					<Link className="h-footer-discover" href="/hotel">
						Find your next stay <NorthEastIcon fontSize="small" />
					</Link>
				</div>
				<nav className="h-footer-navigation" aria-label="Footer navigation">
					<div>
						<h2>Explore</h2>
						<Link href="/hotel">Stays</Link>
						<Link href="/hotel-owner">Hosts</Link>
						<Link href="/journal">Journal</Link>
						<Link href="/about">About Hotelia</Link>
					</div>
					<div>
						<h2>Your stay</h2>
						<Link href="/account?category=myBookings">My trips</Link>
						<Link href="/account?category=myFavorites">Saved stays</Link>
						<Link href="/account?category=myProfile">My account</Link>
						{user.memberType === MemberType.HOTEL_OWNER && <Link href="/owner">Host dashboard</Link>}
						{user.memberType === MemberType.ADMIN && <Link href="/_admin">Admin dashboard</Link>}
					</div>
					<div>
						<h2>Here to help</h2>
						<Link href="/support">Help & FAQ</Link>
						<Link href="/support?tab=inquiries">Your messages</Link>
						<Link href="/support?tab=notices">Platform notices</Link>
					</div>
				</nav>
			</div>
			<div className="h-footer-bottom">
				<div className="h-container">
					<small>© {new Date().getFullYear()} Hotelia</small>
					<a href="#hotelia-top">
						Back to top <ArrowUpwardIcon fontSize="small" />
					</a>
				</div>
			</div>
		</footer>
	);
}
