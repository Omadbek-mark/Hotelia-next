import { Button, EmptyState } from '../common/ui';
import PublicLayout from '../layout/PublicLayout';
export default function SupportPage() {
	return (
		<PublicLayout title="Help">
			<section className="h-section h-container">
				<EmptyState
					title="Hotelia help center"
					description="FAQs, notices and inquiries are planned for the support stage."
					action={<Button href="/account?category=myBookings">My trips</Button>}
				/>
			</section>
		</PublicLayout>
	);
}
