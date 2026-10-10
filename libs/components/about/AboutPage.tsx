import assets from '../../config/design-assets.json';
import { Button, SectionHeading, SiteImage } from '../common/ui';
import PublicLayout from '../layout/PublicLayout';
export default function AboutPage() {
	return (
		<PublicLayout title="About Hotelia">
			<section className="h-section h-container">
				<div className="h-about-intro">
					<div>
						<span className="h-eyebrow">Open Horizons</span>
						<h1>
							Some places
							<br />
							stay with you.
						</h1>
						<p>Discover hotels, meet their owners and find room for your next chapter.</p>
						<Button href="/hotel">Explore hotels ↗</Button>
					</div>
					<SiteImage src={assets.account} alt="A quiet architectural retreat" eager />
				</div>
			</section>
			<section className="h-section h-container">
				<SectionHeading eyebrow="A considered journey" title="Stay a little closer." />
				<div className="h-about-principles">
					{[
						['01', 'Places with character', 'Find hotels by city, amenities and the rooms you need.'],
						['02', 'People behind the stay', 'Meet hotel owners through their public profiles and journals.'],
						['03', 'Room to plan', 'Check nightly availability, request a stay and follow it in My trips.'],
					].map(([number, title, copy]) => (
						<article key={number}>
							<span className="h-eyebrow">{number}</span>
							<h2>{title}</h2>
							<p>{copy}</p>
						</article>
					))}
				</div>
			</section>
		</PublicLayout>
	);
}
