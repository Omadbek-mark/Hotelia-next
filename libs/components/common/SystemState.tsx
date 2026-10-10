import { Button } from './ui';
import PublicLayout from '../layout/PublicLayout';
export default function SystemState({
	code,
	title,
	description,
}: {
	code: string;
	title: string;
	description: string;
}) {
	return (
		<PublicLayout title={title}>
			<section className="h-container h-section h-support-heading">
				<span className="h-eyebrow">Hotelia · {code}</span>
				<h1>{title}</h1>
				<p>{description}</p>
				<Button href="/hotel">Explore hotels</Button>{' '}
				<Button href="/support" variant="outlined">
					Get help
				</Button>
			</section>
		</PublicLayout>
	);
}
