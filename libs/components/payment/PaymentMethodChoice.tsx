import { useId } from 'react';
import Link from 'next/link';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
export default function PaymentMethodChoice() {
	const name = useId();
	return (
		<fieldset className="h-payment-choice">
			<legend>Payment method</legend>
			<label className="h-payment-option h-payment-option--disabled">
				<input type="radio" name={name} value="BANK_CARD" disabled aria-describedby={`${name}-bank-note`} />
				<CreditCardOutlinedIcon aria-hidden="true" />
				<span>
					<strong>By bank card</strong>
					<small>Not activated yet</small>
				</span>
			</label>
			<p className="h-payment-bank-note" id={`${name}-bank-note`}>
				You can add a demo card in <Link href="/account?category=myProfile">Edit profile</Link>. Bank card payments are
				not verified yet. Please use the other option for now.
			</p>
			<label className="h-payment-option h-payment-option--selected">
				<input type="radio" name={name} value="CEO_BANK_ACCOUNT" checked onChange={() => {}} />
				<AccountBalanceOutlinedIcon aria-hidden="true" />
				<span>
					<strong>By CEO bank account</strong>
					<small>Demo option · selected by default</small>
				</span>
			</label>
			<p className="h-payment-demo-note">
				Hotelia is a portfolio demo. This option simulates the payment flow; no transfer is required and no real money
				is charged.
			</p>
		</fieldset>
	);
}
