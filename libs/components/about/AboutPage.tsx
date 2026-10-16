import Image from 'next/image';
import Link from 'next/link';
import { useHoteliaTranslation } from '../../hooks/useHoteliaTranslation';
import assets from '../../config/design-assets.json';
import { SiteImage } from '../common/ui';
import Button from '@mui/material/Button';
import PublicLayout from '../layout/PublicLayout';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';

export default function AboutPage() {
	const tr = useHoteliaTranslation();
	return (
		<PublicLayout title="About us">
			<section className="h-container h-about-stage">
				<div className="h-about-copy">
					<span className="h-eyebrow">{tr('About us · Open Horizons')}</span>
					<h1>
						{tr('More than a stay.')}
						<br />
						<em>{tr('A sense of place.')}</em>
					</h1>
					<p>{tr('Hotelia connects travelers with hotels and hosts across Uzbekistan, Kazakhstan and Kyrgyzstan.')}</p>
					<p>
						{tr(
							'Our goal is to make planning a stay clearer: discover destinations, compare rooms and availability, and keep track of booking requests in one place.',
						)}
					</p>
					<Button component={Link} variant="contained" className="h-button" href="/hotel">
						{tr('Find your place ↗')}
					</Button>
					<div className="h-about-signature">
						<Image src="/img/hotelia/hotelia-logo-v1.png" alt="" width="40" height="40" />
						<span>
							{tr('Thoughtful places.')}
							<br />
							{tr('Personal connections.')}
						</span>
					</div>
				</div>
				<div className="h-about-image">
					<SiteImage src={assets.account} alt={tr('A quiet architectural retreat')} eager />
					<span className="h-about-image-tag">
						{tr('A little farther.')}
						<br />
						{tr('A little closer.')}
					</span>
					<span className="h-about-image-caption">{tr('The Hotelia way')}</span>
				</div>
			</section>
			<section className="h-about-values">
				<div className="h-container">
					<div className="h-section-heading">
						<div>
							<span className="h-eyebrow">{tr('A considered journey')}</span>
							<h2>{tr('Stay a little closer.')}</h2>
						</div>
						<p>
							{tr('Hotels with character.')}
							<br />
							{tr('People worth meeting.')}
						</p>
					</div>
					<div className="h-about-value-grid">
						{[
							[
								AutoAwesomeOutlinedIcon,
								'01',
								'Places with character',
								'Find hotels by city, amenities and the rooms you need.',
							],
							[
								PeopleOutlineIcon,
								'02',
								'People behind the stay',
								'Meet hotel owners through their public profiles and journals.',
							],
							[
								CalendarMonthOutlinedIcon,
								'03',
								'Room to plan',
								'Check nightly availability, request a stay and follow it in My trips.',
							],
						].map(([Icon, number, title, copy]) => {
							const Symbol = Icon as typeof AutoAwesomeOutlinedIcon;
							return (
								<article key={String(number)}>
									<div>
										<Symbol />
										<span>{String(number)}</span>
									</div>
									<h3>{tr(String(title))}</h3>
									<p>{tr(String(copy))}</p>
								</article>
							);
						})}
					</div>
				</div>
			</section>
			<section className="h-container h-about-journey">
				<div>
					<span className="h-eyebrow">{tr('From inspiration to arrival')}</span>
					<h2>
						{tr('Your next chapter,')}
						<br />
						{tr('one step at a time.')}
					</h2>
					<p>{tr('A clear path to a stay that feels like you.')}</p>
				</div>
				<ol>
					{[
						['Discover', 'Explore destinations and save the stays you love.'],
						['Choose', 'Compare rooms, dates and guest capacity.'],
						['Request', 'Send a booking request and follow its status in your account.'],
						['Connect', 'Meet hosts, follow their stories and share your own.'],
					].map(([title, text], index) => (
						<li key={title}>
							<span>0{index + 1}</span>
							<div>
								<h3>{tr(title)}</h3>
								<p>{tr(text)}</p>
							</div>
						</li>
					))}
				</ol>
			</section>
			<section className="h-container h-about-invitation">
				<div>
					<span className="h-eyebrow">{tr('Open your horizons')}</span>
					<h2>
						{tr('Some places')}
						<br />
						{tr('stay with you.')}
					</h2>
				</div>
				<div>
					<p>{tr('Your next journey starts with a place — and the people behind it.')}</p>
					<Button component={Link} variant="contained" className="h-button" href="/hotel-owner">
						{tr('Meet our hosts ↗')}
					</Button>
					<Link href="/support" className="h-text-link">
						{tr('Here to help ↗')}
					</Link>
				</div>
			</section>
		</PublicLayout>
	);
}
