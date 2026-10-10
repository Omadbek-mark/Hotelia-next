import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import PublicLayout from '../../libs/components/layout/PublicLayout';
import MemberProfile from '../../libs/components/member/MemberProfile';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

export default function Page() {
	return (
		<PublicLayout>
			<MemberProfile host />
		</PublicLayout>
	);
}
