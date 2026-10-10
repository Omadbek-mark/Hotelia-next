import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import JournalDetail from '../../libs/components/community/JournalDetail';
import PublicLayout from '../../libs/components/layout/PublicLayout';
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
