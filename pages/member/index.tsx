import PublicLayout from '../../libs/components/hotelia/PublicLayout';
import MemberProfile from '../../libs/components/hotelia/MemberProfile';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

export default function Page() {
	return (
		<PublicLayout>
			<MemberProfile />
		</PublicLayout>
	);
}
