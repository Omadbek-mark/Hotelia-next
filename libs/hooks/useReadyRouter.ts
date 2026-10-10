import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// Query-dependent pages wait until hydration finishes. Next can expose a ready
// router on the client while its server-rendered counterpart is still unready.
export function useReadyRouter() {
	const router = useRouter();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	return { ...router, isReady: mounted && router.isReady };
}
