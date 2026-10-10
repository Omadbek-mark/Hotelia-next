import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import OwnerWorkspace from '../../libs/components/owner/OwnerWorkspace';
export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
export default function Page() {
	return <OwnerWorkspace editor="room" />;
}
