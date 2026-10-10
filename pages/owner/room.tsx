import OwnerWorkspace from '../../libs/components/hotelia/OwnerWorkspace';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
export default function Page() {
	return <OwnerWorkspace editor="room" />;
}
