import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import assets from '../../config/design-assets.json';
import { HotelSort } from '../../enums';
import { SectionHeading, SiteImage } from '../common/ui';
import PublicLayout from '../layout/PublicLayout';
import SearchBar from '../property/SearchBar';
import Hosts from './FeaturedHosts';
import HotelSection from './HotelSection';

const destinations = [
	{ city: 'Seoul', label: 'Seoul Bukchon', subtitle: 'Quiet courtyards. City energy.' },
	{ city: 'Busan', label: 'Haeundae Coast', subtitle: 'Sea air. Slower mornings.' },
	{ city: 'Tashkent', label: 'Mirabad Oasis', subtitle: 'Garden stays. Local character.' },
];

export default function Home() {
	return (
		<PublicLayout title="Find your next stay">
			<div className="h-home">
				<section className="h-home-hero">
					<SiteImage
						className="h-home-hero-image"
						src={assets.home}
						alt="A peaceful courtyard retreat framed by forest and mountains"
						eager
					/>
					<div className="h-container h-home-hero-content">
						<div className="h-home-intro">
							<span className="h-eyebrow">Open Horizons</span>
							<h1>
								Some places stay
								<br className="h-hero-break" /> with you.
							</h1>
							<p>Boutique hotels and architectural stays across East and Central Asia.</p>
						</div>
						<SearchBar />
					</div>
				</section>
				<HotelSection title="Featured stays" eyebrow="Worth discovering" sort={HotelSort.RATING} />
				<section className="h-section h-destinations">
					<div className="h-container">
						<SectionHeading eyebrow="A change of scenery" title="Curated destinations" />
						<div className="h-destination-grid">
							{destinations.map((destination, index) => (
								<Link
									key={destination.city}
									className="h-destination-card"
									href={`/property?destination=${destination.city}`}
								>
									<SiteImage src={assets.destinations[index]} alt={destination.label} />
									<div>
										<h3>{destination.label}</h3>
										<p>{destination.subtitle}</p>
									</div>
									<ArrowForwardIcon />
								</Link>
							))}
						</div>
					</div>
				</section>
				<HotelSection title="Loved by travelers" eyebrow="Popular places" sort={HotelSort.MOST_POPULAR} />
				<section className="h-home-story h-container">
					<div>
						<span className="h-eyebrow">A little farther. A little closer.</span>
						<h2>
							Every stay tells
							<br />
							its own story.
						</h2>
					</div>
					<div>
						<p>Find somewhere that feels like you.</p>
						<Link className="h-text-link" href="/community">
							Explore the journal <ArrowForwardIcon fontSize="small" />
						</Link>
					</div>
				</section>
				<Hosts />
			</div>
		</PublicLayout>
	);
}
