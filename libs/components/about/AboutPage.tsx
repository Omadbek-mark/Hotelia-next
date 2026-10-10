import { Button, SectionHeading } from '../common/ui';
import PublicLayout from '../layout/PublicLayout';
export default function AboutPage() {
	return (
		<PublicLayout title="About Hotelia">
			<section className="h-section h-container">
				<SectionHeading eyebrow="Open Horizons" title="Some places stay with you." />
				<p>Discover hotels, meet their hosts and plan your next stay.</p>
				<Button href="/hotel">Explore stays</Button>
			</section>
		</PublicLayout>
	);
}
