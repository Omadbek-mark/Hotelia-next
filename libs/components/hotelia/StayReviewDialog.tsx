import { useEffect, useRef, useState } from 'react';
import { useApolloClient, useReactiveVar } from '@apollo/client';
import { Alert, Dialog, DialogContent, DialogTitle, IconButton, Rating, Skeleton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { userVar } from '../../../apollo/store';
import { CREATE_STAY_REVIEW } from '../../../apollo/hotelia/bookings';
import { GET_HOTEL_REVIEWS } from '../../../apollo/hotelia/hotel-detail';
import type { Booking, Comment, Comments } from '../../types/hotelia/contracts';
import { CommentGroup, Direction } from '../../types/hotelia/enums';
import { bookingError, canReviewTrip, findBookingReview } from '../../booking/booking-request';
import { Button, Field } from './ui';

export default function StayReviewDialog({
	booking,
	onClose,
	onReviewed,
}: {
	booking: Booking;
	onClose: () => void;
	onReviewed: (id: string) => void;
}) {
	const client = useApolloClient(),
		user = useReactiveVar(userVar);
	const [loading, setLoading] = useState(true),
		[pending, setPending] = useState(false),
		[error, setError] = useState(''),
		[existing, setExisting] = useState<Comment>(),
		[rating, setRating] = useState<number | null>(null),
		[text, setText] = useState(''),
		[checked, setChecked] = useState(false);
	const guard = useRef(false);
	const [alreadyReviewed, setAlreadyReviewed] = useState(false);
	const check = async () => {
		setLoading(true);
		setError('');
		setChecked(false);
		try {
			const found = await findBookingReview(booking._id, async (page) => {
				const result = await client.query<{ getComments: Comments }>({
					query: GET_HOTEL_REVIEWS,
					variables: {
						input: {
							page,
							limit: 100,
							sort: 'createdAt',
							direction: Direction.DESC,
							search: { commentRefId: booking.hotelId, commentGroup: CommentGroup.HOTEL },
						},
					},
					fetchPolicy: 'network-only',
				});
				return { list: result.data.getComments.list, total: result.data.getComments.metaCounter?.[0]?.total || 0 };
			});
			setExisting(found);
			setChecked(true);
			if (found) onReviewed(booking._id);
		} catch {
			setError('Your previous review could not be checked. Try again.');
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		void check();
	}, [booking._id]);
	const submit = async () => {
		if (guard.current || existing || !checked) return;
		const content = text.trim();
		if (
			!canReviewTrip(booking, user._id) ||
			!rating ||
			!Number.isInteger(rating) ||
			rating < 1 ||
			rating > 5 ||
			!content ||
			content.length > 100
		) {
			setError('Choose 1–5 stars and write a review of up to 100 characters.');
			return;
		}
		guard.current = true;
		setPending(true);
		setError('');
		try {
			const result = await client.mutate<{ createComment: Comment }>({
				mutation: CREATE_STAY_REVIEW,
				variables: {
					input: {
						bookingId: booking._id,
						commentRefId: booking.hotelId,
						commentGroup: CommentGroup.HOTEL,
						rating,
						commentContent: content,
					},
				},
			});
			if (!result.data?.createComment) throw Error('No review result');
			setExisting(result.data.createComment);
			onReviewed(booking._id);
			client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'getComments' });
			client.cache.evict({ id: client.cache.identify({ __typename: 'Hotel', _id: booking.hotelId }) });
		} catch (failure) {
			if (failure instanceof Error && /already has a review/i.test(failure.message)) {
				setAlreadyReviewed(true);
				onReviewed(booking._id);
			}
			setError(bookingError(failure));
		} finally {
			guard.current = false;
			setPending(false);
		}
	};
	return (
		<Dialog
			open
			onClose={() => {
				if (!pending) onClose();
			}}
			maxWidth="sm"
			fullWidth
			aria-labelledby="stay-review-title"
		>
			<DialogTitle id="stay-review-title">
				{existing ? 'Your stay review' : 'A story worth sharing'}
				<IconButton aria-label="Close review" disabled={pending} onClick={onClose} sx={{ float: 'right' }}>
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent>
				<div className="h-review-form">
					<span className="h-eyebrow">{booking.hotelData?.hotelName || 'Your completed stay'}</span>
					{loading ? (
						<Skeleton height={160} />
					) : existing ? (
						<>
							<Rating value={existing.rating || 0} readOnly />
							<p>“{existing.commentContent}”</p>
							<Alert severity="success">Your review is saved.</Alert>
						</>
					) : alreadyReviewed ? (
						<Alert severity="info">A review has already been submitted for this stay.</Alert>
					) : checked ? (
						<>
							<Rating name="stay-rating" value={rating} onChange={(_, value) => setRating(value)} precision={1} />
							<Field
								label="Your review"
								multiline
								minRows={3}
								value={text}
								onChange={(event) => setText(event.target.value)}
								inputProps={{ maxLength: 100 }}
								helperText={`${text.length}/100`}
							/>
							<Button disabled={pending || !rating || !text.trim()} color="secondary" onClick={submit}>
								{pending ? 'Saving…' : 'Publish review'}
							</Button>
						</>
					) : (
						<Button variant="outlined" onClick={check}>
							Try again
						</Button>
					)}
					{error && <Alert severity="error">{error}</Alert>}
				</div>
			</DialogContent>
		</Dialog>
	);
}
