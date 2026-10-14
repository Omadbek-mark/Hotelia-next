import { useApolloClient, useReactiveVar } from '@apollo/client';
import { Alert } from '@mui/material';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { FOLLOW_MEMBER, UNFOLLOW_MEMBER } from '../../../apollo/user/social';
import { Button } from './ui';

export default function FollowButton({
	memberId,
	following,
	disabled = false,
}: {
	memberId: string;
	following: boolean;
	disabled?: boolean;
}) {
	const user = useReactiveVar(userVar),
		client = useApolloClient(),
		router = useRouter();
	const guard = useRef(false),
		[pending, setPending] = useState(false),
		[error, setError] = useState('');
	if (user._id === memberId) return null;
	const refresh = () =>
		client.refetchQueries({
			include: 'active',
			onQueryUpdated: (query) =>
				['HostDirectory', 'PublicMember', 'MemberFollowers', 'MemberFollowings'].includes(query.queryName || '')
					? query.refetch()
					: false,
		});
	const toggle = async () => {
		if (guard.current || disabled) return;
		if (!user._id) {
			await router.push({ pathname: '/account/join', query: { referrer: router.asPath } });
			return;
		}
		guard.current = true;
		setPending(true);
		setError('');
		const viewer = user._id;
		try {
			const result = await client.mutate({
				mutation: following ? UNFOLLOW_MEMBER : FOLLOW_MEMBER,
				variables: { input: memberId },
			});
			if (!result.data?.[following ? 'unsubscribe' : 'subscribe']) throw Error('No follow response');
			if (userVar()._id === viewer) {
				try {
					await refresh();
				} catch {
					setError('Connection updated. Refresh to see the latest status.');
				}
			}
		} catch {
			setError('Could not confirm this change. Refresh and try again.');
			if (userVar()._id === viewer) await refresh().catch(() => {});
		} finally {
			guard.current = false;
			setPending(false);
		}
	};
	return (
		<div className="h-follow-action">
			<Button
				variant={following ? 'outlined' : 'contained'}
				color="secondary"
				aria-pressed={following}
				disabled={disabled || pending}
				onClick={() => {
					void toggle().catch(() => setError('Log in could not open. Try again.'));
				}}
			>
				{pending ? 'Updating…' : following ? 'Following' : 'Follow'}
			</Button>
			{error && <Alert severity="warning">{error}</Alert>}
		</div>
	);
}
