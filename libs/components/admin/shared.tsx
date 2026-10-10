import { DocumentNode, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Alert } from '@mui/material';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { AdminSection, label, parseAdminFilters, statuses } from '../../admin/model';
import { MemberType, MemberStatus } from '../../enums';
import { Button, Chip, EmptyState, Field, Modal } from '../common/ui';
export function useAdminList<T>(document: DocumentNode, input: object, valid = true) {
	const user = useReactiveVar(userVar);
	return useQuery<T>(document, {
		variables: { input },
		skip: !valid || !user._id || user.memberType !== MemberType.ADMIN || user.memberStatus !== MemberStatus.ACTIVE,
		fetchPolicy: 'network-only',
		notifyOnNetworkStatusChange: true,
	});
}
export function useAdminFilters(section: AdminSection) {
	const router = useRouter(),
		filters = parseAdminFilters(section, router.query);
	return {
		...filters,
		valid: router.isReady && filters.valid,
		change: (changes: Record<string, string | number>) => {
			const next: Record<string, string | number> = {};
			for (const key of ['status', 'text', 'type', 'category', 'hotelId'])
				if (typeof router.query[key] === 'string') next[key] = router.query[key] as string;
			Object.assign(next, changes);
			if (!('page' in changes)) delete next.page;
			for (const key of Object.keys(next)) if (!next[key] || (key === 'page' && next[key] === 1)) delete next[key];
			void router.push({ pathname: router.pathname, query: next });
		},
	};
}
export function AdminFilters({
	section,
	filters,
	extra,
}: {
	section: AdminSection;
	filters: ReturnType<typeof useAdminFilters>;
	extra?: ReactNode;
}) {
	const [text, setText] = useState(filters.text);
	useEffect(() => setText(filters.text), [filters.text]);
	return (
		<div className="h-admin-filters">
			{['hotels', 'users'].includes(section) && (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						filters.change({ text: text.trim() });
					}}
				>
					<Field
						label={section === 'users' ? 'Search nickname' : 'Search hotels'}
						value={text}
						inputProps={{ maxLength: 100 }}
						onChange={(e) => setText(e.target.value)}
					/>
					<Button type="submit" variant="outlined">
						Search
					</Button>
				</form>
			)}
			<Field
				select
				SelectProps={{ native: true }}
				InputLabelProps={{ shrink: true }}
				label="Status"
				value={filters.status}
				onChange={(e) => filters.change({ status: e.target.value })}
			>
				<option value="">All statuses</option>
				{statuses[section].map((s) => (
					<option key={s} value={s}>
						{section === 'inquiry' ? (s === 'HOLD' ? 'Awaiting reply' : 'Replied') : label(s)}
					</option>
				))}
			</Field>
			{extra}
		</div>
	);
}
export function AdminHeading({
	eyebrow = 'Administration',
	title,
	description,
	action,
}: {
	eyebrow?: string;
	title: string;
	description: string;
	action?: ReactNode;
}) {
	return (
		<div className="h-admin-heading">
			<div>
				<span className="h-eyebrow">{eyebrow}</span>
				<h1>{title}</h1>
				<p>{description}</p>
			</div>
			{action}
		</div>
	);
}
export function AdminState({
	valid = true,
	loading,
	error,
	empty,
	refresh,
	children,
}: {
	valid?: boolean;
	loading: boolean;
	error?: unknown;
	empty?: boolean;
	refresh: () => unknown;
	children: ReactNode;
}) {
	if (!valid)
		return <EmptyState error title="Check the filters" description="Use a valid page and filter selection." />;
	if (loading) return <EmptyState title="Opening the latest records…" />;
	if (error)
		return (
			<EmptyState
				error
				title="Records unavailable"
				action={<Button onClick={() => void Promise.resolve(refresh()).catch(() => {})}>Retry</Button>}
			/>
		);
	if (empty) return <EmptyState title="A clear view" description="No records match these filters." />;
	return <>{children}</>;
}
export const statusTone = (status: string) =>
	status === 'ACTIVE' || status === 'COMPLETED'
		? 'success'
		: status === 'BLOCK' || status === 'DELETE' || status === 'CANCELLED'
		? 'danger'
		: 'warning';
export function Status({ value }: { value: string }) {
	return <Chip tone={statusTone(value)}>{label(value)}</Chip>;
}
export const shortDate = (value: string) =>
	new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(
		new Date(value),
	);
export function useAdminAction(document: DocumentNode, refresh: () => Promise<unknown>) {
	const [mutate] = useMutation(document),
		[action, setAction] = useState<{ title: string; description: string; variables: object } | null>(null),
		[busy, setBusy] = useState(false),
		[feedback, setFeedback] = useState(''),
		[failed, setFailed] = useState(false),
		lock = useRef(false);
	const user = useReactiveVar(userVar);
	useEffect(() => {
		setAction(null);
		setFeedback('');
	}, [user._id]);
	const confirm = async () => {
		if (!action || lock.current || user.memberType !== MemberType.ADMIN) return;
		lock.current = true;
		setBusy(true);
		setFeedback('');
		const actor = user._id;
		try {
			await mutate({ variables: action.variables });
			if (userVar()._id !== actor) return;
			setAction(null);
			setFailed(false);
			setFeedback('Change saved.');
			await refresh().catch(() => {
				setFeedback('Change saved. Refresh to see the latest records.');
			});
		} catch {
			if (userVar()._id === actor) {
				setAction(null);
				setFailed(true);
				setFeedback('The change could not be confirmed. Refresh and check the current record before trying again.');
				await refresh().catch(() => {});
			}
		} finally {
			lock.current = false;
			setBusy(false);
		}
	};
	return {
		open: setAction,
		busy,
		ui: (
			<>
				{feedback && <Alert severity={failed ? 'error' : 'success'}>{feedback}</Alert>}
				<Modal
					open={!!action}
					title={action?.title || 'Confirm change'}
					onClose={() => {
						if (!lock.current) setAction(null);
					}}
				>
					<p>{action?.description}</p>
					<div className="h-admin-actions">
						<Button variant="outlined" disabled={busy} onClick={() => setAction(null)}>
							Keep current
						</Button>
						<Button disabled={busy} onClick={() => void confirm()}>
							{busy ? 'Saving…' : 'Confirm change'}
						</Button>
					</div>
				</Modal>
			</>
		),
	};
}
