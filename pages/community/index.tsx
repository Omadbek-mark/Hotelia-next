import PublicLayout from '../../libs/components/hotelia/PublicLayout';
import Journal from '../../libs/components/hotelia/Journal';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
export default function Page() {
	return (
		<PublicLayout>
			<Journal />
		</PublicLayout>
	);
}
