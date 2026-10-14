import { useHoteliaTranslation } from '../../hooks/useHoteliaTranslation';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import assets from '../../config/design-assets.json';
import { HotelSort } from '../../enums';
import { SectionHeading, SiteImage } from '../common/ui';
import PublicLayout from '../layout/PublicLayout';
import SearchBar from '../hotel/SearchBar';
import Hosts from './FeaturedHosts';
import HotelSection from './HotelSection';

const destinations = [
	{ city: 'Tashkent', label: 'Tashkent', country: 'Uzbekistan', subtitle: 'Courtyards, culture and warm welcomes.', image: '/img/hotelia/tashkent-city.jpg', alt: 'Tashkent skyline and Amir Timur Square', author: 'Guidecity', source: 'https://commons.wikimedia.org/wiki/File:Tashkent_skyline_2019.jpg', license: 'https://creativecommons.org/licenses/by-sa/4.0/', licenseName: 'CC BY-SA 4.0' },
	{ city: 'Almaty', label: 'Almaty', country: 'Kazakhstan', subtitle: 'City rhythms. Mountain horizons.', image: '/img/hotelia/almaty-city.jpg', alt: 'Ascension Cathedral in Almaty', author: 'Radosław Botev / Fundacja Nomos', source: 'https://commons.wikimedia.org/wiki/File:Ascension_Cathedral_Almaty.jpg', license: 'https://creativecommons.org/licenses/by/3.0/pl/', licenseName: 'CC BY 3.0 PL' },
	{ city: 'Bishkek', label: 'Bishkek', country: 'Kyrgyzstan', subtitle: 'Green boulevards. Alpine escapes.', image: '/img/hotelia/bishkek-city.jpg', alt: 'Ala-Too Square in Bishkek', author: 'Emil.akhmatbekov', source: 'https://commons.wikimedia.org/wiki/File:Ala_Too_Square_Bishkek_2021.jpg', license: 'https://creativecommons.org/licenses/by-sa/4.0/', licenseName: 'CC BY-SA 4.0' },
];

export default function Home() {
	const tr = useHoteliaTranslation();
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
								<span>{tr('Some places stay')}</span>
								<br className="h-hero-break" /> {tr('with you.')}
							</h1>
							<p>{tr('Boutique hotels and memorable stays across Central Asia.')}</p>
						</div>
						<SearchBar />
					</div>
				</section>
				<HotelSection title="Featured stays" eyebrow="Worth discovering" sort={HotelSort.MOST_VIEWED} />
				<section className="h-section h-destinations">
					<div className="h-container">
						<SectionHeading eyebrow={tr('A change of scenery')} title={tr('Curated destinations')} />
						<div className="h-destination-grid">
							{destinations.map((destination) => (
								<Link
									key={destination.city}
									className="h-destination-card"
									href={`/hotel?destination=${destination.city}`}
								>
									<SiteImage src={destination.image} alt={destination.alt} />
									<div>
										<span className="h-destination-country">{tr(destination.country)}</span>
										<h3>{tr(destination.label)}</h3>
										<p>{tr(destination.subtitle)}</p>
									</div>
									<ArrowForwardIcon />
								</Link>
							))}
						</div>
						<details className="h-destination-credits">
							<summary>{tr('Photo credits')}</summary>
							{destinations.map(destination => <p key={destination.city}><a href={destination.source} target="_blank" rel="noreferrer">{destination.city} — {destination.author}</a> · <a href={destination.license} target="_blank" rel="noreferrer">{destination.licenseName}</a></p>)}
						</details>
					</div>
				</section>
				<HotelSection title="Loved by travelers" eyebrow="Popular places" sort={HotelSort.MOST_POPULAR} />
				<section className="h-home-story h-container">
					<div>
						<span className="h-eyebrow">{tr('A little farther. A little closer.')}</span>
						<h2>
							{tr('Every stay tells')}
							<br />
							{tr('its own story.')}
						</h2>
					</div>
					<div>
						<p>{tr('Find somewhere that feels like you.')}</p>
						<Link className="h-text-link" href="/journal">
							{tr('Explore the journal')} <ArrowForwardIcon fontSize="small" />
						</Link>
					</div>
				</section>
				<Hosts />
			</div>
		</PublicLayout>
	);
}
