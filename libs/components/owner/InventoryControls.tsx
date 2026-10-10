import { useMutation, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';
import { DELETE_HOTEL, DELETE_ROOM, UPDATE_HOTEL, UPDATE_ROOM } from '../../../apollo/owner/owner';
import { userVar } from '../../../apollo/store';
import { useOwnerRefresh } from '../../hooks/useOwnerRefresh';
import { ownerError } from '../../owner/model';
import { socialHref } from '../../social/query';
import { Hotel, Room } from '../../types/contracts';
import { MemberType } from '../../enums';
import { Button, Modal } from '../common/ui';

export function OwnerStatusFilter({ kind }: { kind: 'hotels' | 'rooms' }) {
	const router = useRouter();
	return (
		<nav className="h-owner-tabs" aria-label="Inventory status">
			{[
				['', 'All'],
				['ACTIVE', 'Active'],
				['PAUSED', 'Paused'],
			].map(([value, text]) => (
				<Button
					key={text}
					variant={(router.query.status || '') === value ? 'contained' : 'text'}
					onClick={() =>
						void router.push(
							socialHref('/owner', { ...router.query, tab: kind, status: value || undefined, page: undefined }),
							undefined,
							{ scroll: false },
						)
					}
				>
					{text}
				</Button>
			))}
		</nav>
	);
}

export function InventoryAction({ item, kind }: { item: Hotel | Room; kind: 'hotel' | 'room' }) {
	const user = useReactiveVar(userVar),
		refresh = useOwnerRefresh(),
		[mutation] = useMutation(kind === 'hotel' ? UPDATE_HOTEL : UPDATE_ROOM),
		[remove] = useMutation(kind === 'hotel' ? DELETE_HOTEL : DELETE_ROOM),
		[busy, setBusy] = useState(false),
		[error, setError] = useState(''),
		[confirm, setConfirm] = useState(false),
		lock = useRef(false);
	const status = kind === 'hotel' ? (item as Hotel).hotelStatus : (item as Room).roomStatus;
	const apply = async (deleting: boolean) => {
		if (lock.current || user.memberType !== MemberType.HOTEL_OWNER) return;
		lock.current = true;
		setBusy(true);
		setError('');
		try {
			await (deleting
				? remove({ variables: { [kind === 'hotel' ? 'hotelId' : 'roomId']: item._id } })
				: mutation({
						variables: {
							input: {
								_id: item._id,
								[kind === 'hotel' ? 'hotelStatus' : 'roomStatus']: status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
							},
						},
				  }));
			setConfirm(false);
		} catch (e) {
			setError(ownerError(e));
		} finally {
			try {
				await refresh();
			} catch {
				setError('Refresh your workspace to see the latest changes.');
			}
			lock.current = false;
			setBusy(false);
		}
	};
	return (
		<>
			<Button variant="outlined" disabled={busy} onClick={() => void apply(false)}>
				{status === 'ACTIVE' ? 'Pause listing' : 'Activate listing'}
			</Button>
			<Button
				variant="text"
				disabled={busy}
				onClick={() => {
					setError('');
					setConfirm(true);
				}}
			>
				Remove {kind}
			</Button>
			{error && (
				<p className="h-owner-error" role="alert">
					{error}
				</p>
			)}
			<Modal
				title={`Remove this ${kind}?`}
				open={confirm}
				onClose={() => {
					if (!busy) setConfirm(false);
				}}
			>
				<p>This listing will be withdrawn. Existing reservations may prevent removal.</p>
				{error && <p role="alert">{error}</p>}
				<div className="h-journal-actions">
					<Button variant="text" disabled={busy} onClick={() => setConfirm(false)}>
						Keep listing
					</Button>
					<Button disabled={busy} onClick={() => void apply(true)}>
						{busy ? 'Removing…' : 'Remove listing'}
					</Button>
				</div>
			</Modal>
		</>
	);
}
