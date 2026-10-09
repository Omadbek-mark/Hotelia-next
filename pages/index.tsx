import Link from 'next/link';
import { useQuery } from '@apollo/client';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Skeleton } from '@mui/material';
import PublicLayout from '../libs/components/hotelia/PublicLayout';
import HotelCard from '../libs/components/hotelia/HotelCard';
import SearchBar from '../libs/components/hotelia/SearchBar';
import { Button, CardSkeletons, EmptyState, SectionHeading, SiteImage } from '../libs/components/hotelia/ui';
import { GET_DISCOVERY_HOSTS, GET_DISCOVERY_HOTELS, HostCardData, HotelCollection } from '../apollo/hotelia/discovery';
import { Direction, HotelSort } from '../libs/types/hotelia/enums';
import { HotelOwnersInquiry, HotelsInquiry, TotalCounter } from '../libs/types/hotelia/contracts';
import assets from '../libs/components/hotelia/design-assets.json';

const destinations = [
	{ city: 'Seoul', label: 'Seoul Bukchon', subtitle: 'Quiet courtyards. City energy.' },
	{ city: 'Busan', label: 'Haeundae Coast', subtitle: 'Sea air. Slower mornings.' },
	{ city: 'Tashkent', label: 'Mirabad Oasis', subtitle: 'Garden stays. Local character.' },
];

function HotelSection({ title, eyebrow, sort }: { title: string; eyebrow: string; sort: HotelSort }) {
	const { data, loading, error, refetch } = useQuery<{ getHotels: HotelCollection }, { input: HotelsInquiry }>(GET_DISCOVERY_HOTELS, {
		variables: { input: { page: 1, limit: 3, sort } }, notifyOnNetworkStatusChange: true,
	});
	return <section className="h-section h-container"><SectionHeading eyebrow={eyebrow} title={title} href={`/property?sort=${sort}`} action="All stays" />
		{loading ? <CardSkeletons /> : error ? <EmptyState title="Stays are taking a moment" description="Please try again." error action={<Button variant="outlined" onClick={() => { void refetch(); }}>Retry</Button>} /> :
			data?.getHotels.list.length ? <div className="h-card-grid">{data.getHotels.list.map((hotel) => <HotelCard key={hotel._id} hotel={hotel} />)}</div> : <EmptyState title="New stays are on their way" />}
	</section>;
}

function Hosts() {
	const { data, loading, error, refetch } = useQuery<{ getHotelOwners: { list: HostCardData[]; metaCounter: TotalCounter[] } }, { input: HotelOwnersInquiry }>(GET_DISCOVERY_HOSTS, {
		variables: { input: { page: 1, limit: 4, sort: 'memberRank', direction: Direction.DESC, search: {} } }, notifyOnNetworkStatusChange: true,
	});
	return <section className="h-section h-container"><SectionHeading eyebrow="People behind the places" title="Meet your hosts" href="/agent" action="All hosts" />
		{loading ? <div className="h-host-grid">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} variant="rectangular" height={160} />)}</div> : error ?
			<EmptyState title="Hosts are taking a moment" error action={<Button variant="outlined" onClick={() => { void refetch(); }}>Retry</Button>} /> : data?.getHotelOwners.list.length ?
			<div className="h-host-grid">{data.getHotelOwners.list.map((host) => <Link className="h-host-card" href={`/agent/detail?agentId=${host._id}`} key={host._id}>
				<SiteImage src={host.memberImage || '/img/profile/defaultUser.svg'} alt={host.memberFullName || host.memberNick} />
				<h3>{host.memberFullName || host.memberNick}</h3><span>{host.memberHotels} {host.memberHotels === 1 ? 'hotel' : 'hotels'}</span><ArrowForwardIcon fontSize="small" />
			</Link>)}</div> : <EmptyState title="More hosts coming soon" />}
	</section>;
}

export default function Home() {
	return <PublicLayout title="Find your next stay"><div className="h-home">
		<section className="h-home-hero"><SiteImage className="h-home-hero-image" src={assets.home} alt="A peaceful courtyard retreat framed by forest and mountains" eager />
			<div className="h-container h-home-hero-content"><div className="h-home-intro"><span className="h-eyebrow">Open Horizons</span>
				<h1>Some places stay<br className="h-hero-break" /> with you.</h1><p>Boutique hotels and architectural stays across East and Central Asia.</p>
			</div><SearchBar /></div>
		</section>
		<HotelSection title="Featured stays" eyebrow="Worth discovering" sort={HotelSort.RATING} />
		<section className="h-section h-destinations"><div className="h-container"><SectionHeading eyebrow="A change of scenery" title="Curated destinations" />
			<div className="h-destination-grid">{destinations.map((destination, index) => <Link key={destination.city} className="h-destination-card" href={`/property?destination=${destination.city}`}>
				<SiteImage src={assets.destinations[index]} alt={destination.label} /><div><h3>{destination.label}</h3><p>{destination.subtitle}</p></div><ArrowForwardIcon />
			</Link>)}</div>
		</div></section>
		<HotelSection title="Loved by travelers" eyebrow="Popular places" sort={HotelSort.MOST_POPULAR} />
		<section className="h-home-story h-container"><div><span className="h-eyebrow">A little farther. A little closer.</span><h2>Every stay tells<br />its own story.</h2></div>
			<div><p>Find somewhere that feels like you.</p><Link className="h-text-link" href="/community">Explore the journal <ArrowForwardIcon fontSize="small" /></Link></div>
		</section>
		<Hosts />
	</div></PublicLayout>;
}
