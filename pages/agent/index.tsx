import PublicLayout from '../../libs/components/hotelia/PublicLayout';
import Hosts from '../../libs/components/hotelia/Hosts';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

export default function Page() {
	return (
		<PublicLayout>
			<Hosts />
		</PublicLayout>
	);
}
