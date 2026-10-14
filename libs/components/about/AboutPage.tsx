import Image from 'next/image';
import assets from '../../config/design-assets.json';
import { Button, SiteImage } from '../common/ui';
import PublicLayout from '../layout/PublicLayout';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';

export default function AboutPage() {
	return (
		<PublicLayout title="About us">
			<section className="h-container h-about-stage">
				<div className="h-about-copy">
					<span className="h-eyebrow">About us · Open Horizons</span>
					<h1>
						More than a stay.
						<br />
						<em>A sense of place.</em>
					</h1>
					<p>Discover hotels, meet their owners and find room for your next chapter.</p>
					<Button href="/hotel">Find your place ↗</Button>
					<div className="h-about-signature">
						<Image src="/img/hotelia/hotelia-logo-v1.png" alt="" width="40" height="40" />
						<span>
							Thoughtful places.
							<br />
							Personal connections.
						</span>
					</div>
				</div>
				<div className="h-about-image">
					<SiteImage src={assets.account} alt="A quiet architectural retreat" eager />
					<span className="h-about-image-tag">
						A little farther.
						<br />A little closer.
					</span>
					<span className="h-about-image-caption">The Hotelia way</span>
				</div>
			</section>
			<section className="h-about-values">
				<div className="h-container">
					<div className="h-section-heading">
						<div>
							<span className="h-eyebrow">A considered journey</span>
							<h2>Stay a little closer.</h2>
						</div>
						<p>
							Hotels with character.
							<br />
							People worth meeting.
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
									<h3>{String(title)}</h3>
									<p>{String(copy)}</p>
								</article>
							);
						})}
					</div>
				</div>
			</section>
			<section className="h-container h-about-journey">
				<div>
					<span className="h-eyebrow">From inspiration to arrival</span>
					<h2>
						Your next chapter,
						<br />
						one step at a time.
					</h2>
					<p>A clear path to a stay that feels like you.</p>
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
								<h3>{title}</h3>
								<p>{text}</p>
							</div>
						</li>
					))}
				</ol>
			</section>
			<section className="h-container h-about-invitation">
				<div>
					<span className="h-eyebrow">Open your horizons</span>
					<h2>
						Some places
						<br />
						stay with you.
					</h2>
				</div>
				<div>
					<p>Your next journey starts with a place — and the people behind it.</p>
					<Button href="/hotel-owner">Meet our hosts ↗</Button>
					<a href="/support" className="h-text-link">
						Here to help ↗
					</a>
				</div>
			</section>
		</PublicLayout>
	);
}
