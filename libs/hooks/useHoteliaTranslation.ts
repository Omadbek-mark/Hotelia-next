import { useTranslation } from 'next-i18next';

export function useHoteliaTranslation() {
	const { t } = useTranslation('common');
	return (text: string) => t(text, { defaultValue: text });
}
