import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Journal from '../../libs/components/community/Journal';
import PublicLayout from '../../libs/components/layout/PublicLayout';
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
