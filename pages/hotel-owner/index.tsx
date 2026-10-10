import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import HotelOwners from '../../libs/components/owner/HotelOwners';
import PublicLayout from '../../libs/components/layout/PublicLayout';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

export default function Page() {
	return (
		<PublicLayout>
			<HotelOwners />
		</PublicLayout>
	);
}
