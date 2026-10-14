import { useReactiveVar } from '@apollo/client';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
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
					<small className="h-footer-copyright">© {new Date().getFullYear()} Hotelia</small>
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
						<h2>Your Hotelia</h2>
						<Link href="/account?category=myProfile">My profile</Link>
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
			<div className="h-footer-return">
				<a className="h-back-to-top" href="#hotelia-top" aria-label="Back to top" title="Back to top">
					<KeyboardArrowUpIcon />
				</a>
			</div>
		</footer>
	);
}
