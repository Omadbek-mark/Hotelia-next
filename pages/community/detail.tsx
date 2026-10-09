import PublicLayout from '../../libs/components/hotelia/PublicLayout';
import JournalDetail from '../../libs/components/hotelia/JournalDetail';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
export default function Page() {
	return (
		<PublicLayout>
			<JournalDetail />
		</PublicLayout>
	);
}
