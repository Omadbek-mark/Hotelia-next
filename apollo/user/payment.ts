import { gql } from '@apollo/client';
export const PAYMENT_CARD_FIELDS = gql`
	fragment PaymentCardFields on PaymentCard {
		_id
		cardBrand
		cardLast4
		cardHolderName
		expiryMonth
		expiryYear
		cardStatus
		createdAt
		updatedAt
	}
`;
export const GET_MY_PAYMENT_CARD = gql`
	query MyPaymentCard {
		getMyPaymentCard {
			...PaymentCardFields
		}
	}
	${PAYMENT_CARD_FIELDS}
`;
export const SAVE_PAYMENT_CARD = gql`
	mutation SavePaymentCard($input: PaymentCardInput!) {
		saveMyPaymentCard(input: $input) {
			...PaymentCardFields
		}
	}
	${PAYMENT_CARD_FIELDS}
`;
