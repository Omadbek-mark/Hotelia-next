import { CardBrand } from '../enums';
import type { PaymentCardInput } from '../types/contracts';
export const DEMO_CARD_NUMBERS = { VISA: '4242 4242 4242 4242', MASTERCARD: '5555 5555 5555 4444' };
export function demoCardInput(number: string, expiry: string, holder: string, now = new Date()): PaymentCardInput {
	const digits = number.replace(/\s/g, '');
	const brand =
		digits === '4242424242424242' ? CardBrand.VISA : digits === '5555555555554444' ? CardBrand.MASTERCARD : undefined;
	if (!brand) throw Error('Use the Visa or Mastercard test number shown above. Real cards are not supported.');
	const parts = /^(\d{2})\s*\/\s*(\d{2})$/.exec(expiry.trim());
	const month = parts ? Number(parts[1]) : 0,
		year = parts ? 2000 + Number(parts[2]) : 0;
	if (month < 1 || month > 12 || year * 12 + month < now.getUTCFullYear() * 12 + now.getUTCMonth() + 1)
		throw Error('Enter a valid future expiry date in MM/YY format.');
	const name = holder.trim();
	if (name.length < 2 || name.length > 80) throw Error('Enter a cardholder name between 2 and 80 characters.');
	return { cardBrand: brand, cardLast4: digits.slice(-4), cardHolderName: name, expiryMonth: month, expiryYear: year };
}
