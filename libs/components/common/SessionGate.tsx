import { useReactiveVar } from '@apollo/client';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { userVar } from '../../../apollo/store';
import { updateUserInfo } from '../../auth';
import { Button, EmptyState } from './ui';
export default function SessionGate({ children }: { children: ReactNode }) {
	const user = useReactiveVar(userVar),
		router = useRouter(),
		[ready, setReady] = useState(false);
	useEffect(() => {
		let active = true;
		void updateUserInfo().finally(() => {
			if (active) setReady(true);
		});
		return () => {
			active = false;
		};
	}, []);
	if (!ready) return <EmptyState title="Opening your account…" />;
	if (!user._id)
		return (
			<EmptyState
				title="Log in to continue"
				description="Your messages and updates are private."
				action={<Button href={`/account/join?referrer=${encodeURIComponent(router.asPath)}`}>Log in</Button>}
			/>
		);
	return <>{children}</>;
}
