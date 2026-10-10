import { useReactiveVar } from '@apollo/client';
import { useEffect, useRef } from 'react';
import { userVar } from '../../apollo/store';

// Public queries contain viewer-specific follow status. Reload it when a session is restored or changed.
export function useViewerRefresh(refetch: () => Promise<unknown>, enabled: boolean) {
	const user = useReactiveVar(userVar),
		previous = useRef(user._id);
	useEffect(() => {
		if (previous.current !== user._id) {
			previous.current = user._id;
			if (enabled) void refetch().catch(() => {});
		}
	}, [user._id, enabled, refetch]);
}
