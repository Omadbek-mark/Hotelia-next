import { useMutation, useReactiveVar } from '@apollo/client';
import { Alert, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import { FormEvent, useRef, useState } from 'react';
import { SAVE_PAYMENT_CARD } from '../../../apollo/user/payment';
import { userVar } from '../../../apollo/store';
import { DEMO_CARD_NUMBERS, demoCardInput } from '../../payment/demo-card';
import type { PaymentCard, PaymentCardInput } from '../../types/contracts';
import { Button, Chip, Field } from '../common/ui';

export default function PaymentCardDialog({
	onClose,
	savedCard,
}: {
	onClose: () => void;
	savedCard?: PaymentCard | null;
}) {
	const user = useReactiveVar(userVar);
	const [number, setNumber] = useState(DEMO_CARD_NUMBERS.VISA);
	const [expiry, setExpiry] = useState(
		savedCard ? `${String(savedCard.expiryMonth).padStart(2, '0')}/${String(savedCard.expiryYear).slice(-2)}` : '',
	);
	const [holder, setHolder] = useState(savedCard?.cardHolderName || user.memberFullName || user.memberNick || '');
	const [error, setError] = useState('');
	const [receipt, setReceipt] = useState<PaymentCard>();
	const lock = useRef(false);
	const [save, { loading }] = useMutation<{ saveMyPaymentCard: PaymentCard }, { input: PaymentCardInput }>(
		SAVE_PAYMENT_CARD,
	);
	const mastercard = number.replace(/\s/g, '').startsWith('5');
	async function submit(event: FormEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (lock.current || receipt || !user._id) return;
		const memberId = user._id;
		setError('');
		let input: PaymentCardInput;
		try {
			input = demoCardInput(number, expiry, holder);
		} catch (failure) {
			setError((failure as Error).message);
			return;
		}
		lock.current = true;
		try {
			const result = await save({ variables: { input } });
			if (userVar()._id !== memberId) return;
			if (!result.data?.saveMyPaymentCard) throw Error('No card response');
			setReceipt(result.data.saveMyPaymentCard);
			setNumber('');
		} catch {
			if (userVar()._id === memberId) setError('The demo card could not be saved. Please try again.');
		} finally {
			lock.current = false;
		}
	}
	return (
		<Dialog
			open
			fullWidth
			maxWidth="sm"
			className="h-payment-card-dialog"
			onClose={loading ? undefined : onClose}
			aria-labelledby="payment-card-title"
		>
			<DialogTitle id="payment-card-title">
				{receipt ? 'Demo card added' : savedCard ? 'Update demo payment card' : 'Add payment card'}
				<IconButton aria-label="Close payment card" disabled={loading} onClick={onClose}>
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent>
				<Alert severity="info" className="h-payment-disclaimer">
					Demo only. You can save a test card, but bank card payments and verification are not activated. Use the test
					numbers below; never enter a real card.
				</Alert>
				<div className="h-payment-card-preview" aria-label="Demo payment card preview">
					<div>
						<span>HOTELIA</span>
						<Chip>DEMO</Chip>
					</div>
					<CreditCardOutlinedIcon className="h-payment-card-chip" aria-hidden="true" />
					<p className="h-payment-card-number">
						•••• &nbsp;•••• &nbsp;•••• &nbsp;{receipt?.cardLast4 || number.replace(/\s/g, '').slice(-4) || '0000'}
					</p>
					<div className="h-payment-card-bottom">
						<span>
							<small>CARDHOLDER</small>
							{receipt?.cardHolderName || holder || 'YOUR NAME'}
						</span>
						<span>
							<small>EXPIRES</small>
							{receipt
								? `${String(receipt.expiryMonth).padStart(2, '0')}/${String(receipt.expiryYear).slice(-2)}`
								: expiry || 'MM/YY'}
						</span>
						<strong>{receipt?.cardBrand || (mastercard ? 'Mastercard' : 'VISA')}</strong>
					</div>
				</div>
				{receipt ? (
					<>
						<Alert severity="success">
							Saved as a pending demo card. Bank card payments remain unavailable; no money was charged.
						</Alert>
						<div className="h-dialog-actions">
							<Button fullWidth onClick={onClose}>
								Done
							</Button>
						</div>
					</>
				) : (
					<form onSubmit={submit} aria-busy={loading}>
						<div className="h-payment-test-brands" aria-label="Choose a test card">
							<button
								type="button"
								disabled={loading}
								className={!mastercard ? 'is-active' : ''}
								onClick={() => setNumber(DEMO_CARD_NUMBERS.VISA)}
							>
								<strong>VISA</strong>
								<span>4242 4242 4242 4242</span>
							</button>
							<button
								type="button"
								disabled={loading}
								className={mastercard ? 'is-active' : ''}
								onClick={() => setNumber(DEMO_CARD_NUMBERS.MASTERCARD)}
							>
								<strong>Mastercard</strong>
								<span>5555 5555 5555 4444</span>
							</button>
						</div>
						<Field
							label="Test card number"
							autoComplete="off"
							value={number}
							required
							disabled={loading}
							inputProps={{ inputMode: 'numeric', maxLength: 19 }}
							onChange={(event) => {
								const digits = event.target.value.replace(/\D/g, '').slice(0, 16);
								setNumber(digits.replace(/(.{4})/g, '$1 ').trim());
							}}
						/>
						<div className="h-payment-card-form-row">
							<Field
								label="Expiry (MM/YY)"
								placeholder="12/29"
								value={expiry}
								autoComplete="off"
								required
								disabled={loading}
								inputProps={{ inputMode: 'numeric', maxLength: 5 }}
								onChange={(event) => {
									const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
									setExpiry(digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits);
								}}
							/>
							<Field label="CVV (demo)" value="123" disabled helperText="Placeholder · never collected" />
						</div>
						<Field
							label="Cardholder name"
							value={holder}
							autoComplete="off"
							required
							disabled={loading}
							inputProps={{ maxLength: 80 }}
							onChange={(event) => setHolder(event.target.value)}
						/>
						<p className="h-payment-demo-note">
							Only the card brand, last four digits, expiry and holder name are saved. Full card numbers and CVV are
							never submitted.
						</p>
						{error && <Alert severity="error">{error}</Alert>}
						<div className="h-dialog-actions">
							<Button type="submit" color="secondary" fullWidth disabled={loading}>
								{loading ? 'Saving…' : 'Save demo card'}
							</Button>
							<Button type="button" variant="text" fullWidth disabled={loading} onClick={onClose}>
								Cancel
							</Button>
						</div>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
