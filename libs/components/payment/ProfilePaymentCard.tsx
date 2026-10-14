import { useQuery, useReactiveVar } from '@apollo/client';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import { useState } from 'react';
import { GET_MY_PAYMENT_CARD } from '../../../apollo/user/payment';
import { userVar } from '../../../apollo/store';
import type { PaymentCard } from '../../types/contracts';
import { Button, Chip } from '../common/ui';
import PaymentCardDialog from './PaymentCardDialog';
export default function ProfilePaymentCard() {
	const user = useReactiveVar(userVar);
	const [open, setOpen] = useState(false);
	const result = useQuery<{ getMyPaymentCard: PaymentCard | null }>(GET_MY_PAYMENT_CARD, {
		skip: !user._id,
		fetchPolicy: 'network-only',
	});
	const card = result.data?.getMyPaymentCard;
	return (
		<section className="h-profile-payment">
			<div className="h-profile-payment-heading">
				<CreditCardOutlinedIcon />
				<div>
					<h3>Payment card</h3>
					<p>
						{card
							? `${card.cardBrand} •••• ${card.cardLast4} · ${String(card.expiryMonth).padStart(2, '0')}/${String(
									card.expiryYear,
							  ).slice(-2)}`
							: 'Save a demo card for your Hotelia profile.'}
					</p>
				</div>
				{card && <Chip tone="warning">Pending · demo</Chip>}
			</div>
			<p className="h-payment-demo-note">Bank card payments are not activated yet.</p>
			{result.error && (
				<p role="alert">
					Your saved card could not load.{' '}
					<button type="button" onClick={() => void result.refetch()}>
						Retry
					</button>
				</p>
			)}
			<Button type="button" variant="outlined" onClick={() => setOpen(true)}>
				{card ? 'Update payment card' : 'Add payment card'}
			</Button>
			{open && (
				<PaymentCardDialog
					savedCard={card}
					onClose={() => {
						setOpen(false);
						void result.refetch().catch(() => {});
					}}
				/>
			)}
		</section>
	);
}
