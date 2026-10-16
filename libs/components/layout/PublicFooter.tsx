import { useReactiveVar } from '@apollo/client';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Link from 'next/link';
import { userVar } from '../../../apollo/store';
import { MemberType } from '../../enums';
import { useHoteliaTranslation } from '../../hooks/useHoteliaTranslation';
import { Brand } from './PublicLayout';

export default function PublicFooter() {
	const user = useReactiveVar(userVar);
	const tr = useHoteliaTranslation();
	return (
		<footer className="h-footer">
			<div className="h-container h-footer-inner">
				<div className="h-footer-intro">
					<Brand />
					<p>
						{tr('A little farther.')}
						<br />
						{tr('A little closer.')}
					</p>
					<Link className="h-footer-discover" href="/hotel">
						{tr('Find your next stay')} <NorthEastIcon fontSize="small" />
					</Link>
					<small className="h-footer-copyright">© {new Date().getFullYear()} Hotelia</small>
				</div>
				<nav className="h-footer-navigation" aria-label={tr('Footer navigation')}>
					<div>
						<h2>{tr('Explore')}</h2>
						<Link href="/hotel">{tr('Stays')}</Link>
						<Link href="/hotel-owner">{tr('Hosts')}</Link>
						<Link href="/journal">{tr('Journal')}</Link>
						<Link href="/about">{tr('About Hotelia')}</Link>
					</div>
					<div>
						<h2>{tr('Your Hotelia')}</h2>
						<Link href="/account?category=myProfile">{tr('My profile')}</Link>
						{user.memberType === MemberType.HOTEL_OWNER && <Link href="/owner">{tr('Host dashboard')}</Link>}
						{user.memberType === MemberType.ADMIN && <Link href="/_admin">{tr('Admin dashboard')}</Link>}
					</div>
					<div>
						<h2>{tr('Here to help')}</h2>
						<Link href="/support">{tr('Help & FAQ')}</Link>
						<Link href="/support?tab=inquiries">{tr('Your messages')}</Link>
						<Link href="/support?tab=notices">{tr('Platform notices')}</Link>
					</div>
				</nav>
			</div>
			<div className="h-footer-return">
				<a className="h-back-to-top" href="#hotelia-top" aria-label={tr('Back to top')} title={tr('Back to top')}>
					<KeyboardArrowUpIcon />
				</a>
			</div>
		</footer>
	);
}
