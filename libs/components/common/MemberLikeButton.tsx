import { useApolloClient, useReactiveVar } from '@apollo/client';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { LIKE_MEMBER, MEMBER_LIKE_STATE } from '../../../apollo/user/social';
import type { MeLiked } from '../../types/contracts';

export default function MemberLikeButton({
	memberId,
	name,
	likes,
	records,
}: {
	memberId: string;
	name: string;
	likes?: number;
	records?: MeLiked[] | null;
}) {
	const client = useApolloClient(),
		user = useReactiveVar(userVar),
		router = useRouter();
	const guard = useRef(false);
	const [pending, setPending] = useState(false),
		[error, setError] = useState('');
	const liked =
		!!user._id &&
		!!records?.some((record) => record.memberId === user._id && record.likeRefId === memberId && record.myFavorite);
	const refresh = () =>
		client.refetchQueries({
			include: 'active',
			onQueryUpdated: (query) =>
				['HostDirectory', 'PublicMember'].includes(query.queryName || '') ? query.refetch() : false,
		});
	const toggle = async () => {
		if (guard.current || (user._id && !Array.isArray(records))) return;
		if (!user._id) {
			await router.push({ pathname: '/account/join', query: { referrer: router.asPath } });
			return;
		}
		guard.current = true;
		setPending(true);
		setError('');
		const viewer = user._id;
		try {
			const result = await client.mutate<{ likeTargetMember: { _id: string; memberLikes: number } }>({
				mutation: LIKE_MEMBER,
				variables: { memberId },
				fetchPolicy: 'no-cache',
			});
			const updated = result.data?.likeTargetMember;
			if (!updated || updated._id !== memberId) throw Error('Missing member like result');
			if (userVar()._id === viewer) {
				client.cache.writeFragment({
					id: client.cache.identify({ __typename: 'Member', _id: memberId }),
					fragment: MEMBER_LIKE_STATE,
					data: {
						__typename: 'Member',
						memberLikes: updated.memberLikes,
						meLiked: [{ __typename: 'MeLiked', memberId: viewer, likeRefId: memberId, myFavorite: !liked }],
					},
				});
			}
		} catch {
			if (userVar()._id === viewer) {
				setError('Could not confirm your like. Refresh and try again.');
				await refresh().catch(() => {});
			}
		} finally {
			guard.current = false;
			setPending(false);
		}
	};
	return (
		<div className="h-member-like-action">
			<button
				type="button"
				className={`h-member-like${liked ? ' is-liked' : ''}`}
				aria-label={`${liked ? 'Unlike' : 'Like'} ${name}`}
				aria-pressed={liked}
				disabled={pending || (!!user._id && !Array.isArray(records))}
				onClick={() => void toggle().catch(() => setError('Could not open log in. Try again.'))}
			>
				<FavoriteRoundedIcon />
				<span>{likes == null ? '—' : likes.toLocaleString('en-US')}</span>
			</button>
			{error && (
				<span className="h-member-like-error" role="alert">
					{error}
				</span>
			)}
		</div>
	);
}
