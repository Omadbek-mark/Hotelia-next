import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Alert } from '@mui/material';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { CREATE_SUPPORT_INQUIRY, GET_MY_INQUIRIES } from '../../../apollo/user/support';
import { inquiryInput } from '../../support/model';
import { SupportNotice, SupportNotices } from '../../types/contracts';
import { Button, Chip, EmptyState, Field, Pagination } from '../common/ui';
export default function Inquiries({ page, onPage }: { page: number; onPage: (page: number) => void }) {
	const user = useReactiveVar(userVar),
		list = useQuery<{ getMyInquiries: SupportNotices }>(GET_MY_INQUIRIES, {
			variables: { input: { page, limit: 10 } },
			skip: !user._id,
			fetchPolicy: 'network-only',
			notifyOnNetworkStatusChange: true,
		});
	const [send] = useMutation<{ createSupportInquiry: SupportNotice }>(CREATE_SUPPORT_INQUIRY),
		[title, setTitle] = useState(''),
		[content, setContent] = useState(''),
		[busy, setBusy] = useState(false),
		[error, setError] = useState(''),
		[sent, setSent] = useState('');
	const lock = useRef(false),
		pending = useRef<{ key: string; requestId: string } | null>(null);
	useEffect(() => {
		pending.current = null;
		setTitle('');
		setContent('');
		setError('');
		setSent('');
	}, [user._id]);
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (lock.current || !user._id) return;
		const owner = user._id,
			key = JSON.stringify([owner, title.trim(), content.trim()]);
		if (pending.current && pending.current.key !== key) {
			setError(
				'Your previous message may have been sent. Retry it unchanged or check your messages before starting another.',
			);
			return;
		}
		const requestId = pending.current?.requestId || globalThis.crypto?.randomUUID?.();
		const parsed = inquiryInput(title, content, requestId || '');
		if (!parsed.input) {
			setError(parsed.error || 'Check your message.');
			return;
		}
		pending.current = { key, requestId: parsed.input.requestId };
		lock.current = true;
		setBusy(true);
		setError('');
		setSent('');
		try {
			const { data } = await send({ variables: { input: parsed.input } });
			if (!data?.createSupportInquiry) throw Error('Missing response');
			if (userVar()._id !== owner) return;
			pending.current = null;
			setTitle('');
			setContent('');
			setSent('Message received. You can follow it below.');
			await list.refetch().catch(() => {});
		} catch {
			if (userVar()._id === owner)
				setError('We could not confirm delivery. Retry the same message; it will not create a duplicate.');
		} finally {
			lock.current = false;
			setBusy(false);
		}
	}
	return (
		<div className="h-support-inquiries">
			<form onSubmit={submit} className="h-support-compose">
				<span className="h-eyebrow">A little help</span>
				<h2>Send us a note.</h2>
				<Field
					label="Subject"
					required
					value={title}
					disabled={busy}
					inputProps={{ maxLength: 100, minLength: 3 }}
					onChange={(e) => setTitle(e.target.value)}
				/>
				<Field
					label="Message"
					required
					multiline
					minRows={4}
					value={content}
					disabled={busy}
					inputProps={{ maxLength: 2000, minLength: 10 }}
					onChange={(e) => setContent(e.target.value)}
				/>
				<small>{content.length} / 2,000 · Add booking details if relevant.</small>
				{error && <Alert severity="error">{error}</Alert>}
				{sent && <Alert severity="success">{sent}</Alert>}
				<Button type="submit" disabled={busy}>
					{busy ? 'Sending…' : 'Send message'}
				</Button>
			</form>
			<section>
				<h2>Your messages</h2>
				{list.loading ? (
					<EmptyState title="Opening your messages…" />
				) : list.error ? (
					<EmptyState
						error
						title="Messages unavailable"
						action={<Button onClick={() => void list.refetch()}>Retry</Button>}
					/>
				) : list.data?.getMyInquiries.list.length ? (
					<>
						{list.data.getMyInquiries.list.map((item) => (
							<details key={item._id} className="h-support-answer">
								<summary>
									<h3>{item.noticeTitle}</h3>
									<Chip tone={item.noticeResponse ? 'success' : 'warning'}>
										{item.noticeResponse ? 'Replied' : 'Received'}
									</Chip>
								</summary>
								<p>{item.noticeContent}</p>
								{item.noticeResponse && (
									<div className="h-support-reply">
										<span className="h-eyebrow">Hotelia support</span>
										<p>{item.noticeResponse}</p>
									</div>
								)}
							</details>
						))}
						<Pagination
							page={page}
							total={list.data.getMyInquiries.metaCounter?.[0]?.total || 0}
							limit={10}
							onChange={onPage}
						/>
					</>
				) : (
					<EmptyState title="A clean slate" description="Your support messages will appear here." />
				)}
			</section>
		</div>
	);
}
