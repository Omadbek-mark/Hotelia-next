import { useMutation } from '@apollo/client';
import { Alert } from '@mui/material';
import { useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import {
	ADMIN_SUPPORT,
	ADMIN_SUPPORT_CREATE,
	ADMIN_SUPPORT_REPLY,
	ADMIN_SUPPORT_UPDATE,
} from '../../../apollo/admin/admin';
import { AdminSection, label, noticeCategory, publicNoticeInput } from '../../admin/model';
import { NoticeStatus, MemberType } from '../../enums';
import { AdminSupportNotice, AdminSupportNotices } from '../../types/contracts';
import { Button, Chip, Field, Modal, Pagination } from '../common/ui';
import { AdminFilters, AdminHeading, AdminState, shortDate, Status, useAdminFilters, useAdminList } from './shared';
type Editor = { row?: AdminSupportNotice; title: string; content: string; response: string; status: NoticeStatus };
export default function AdminSupport({ section }: { section: AdminSection }) {
	const filters = useAdminFilters(section),
		category = noticeCategory(section, filters.category),
		inquiry = section === 'inquiry';
	const query = useAdminList<{ getSupportByAdmin: AdminSupportNotices }>(
			ADMIN_SUPPORT,
			{
				page: filters.page,
				limit: 10,
				noticeCategory: category,
				...(filters.status ? { noticeStatus: filters.status } : {}),
			},
			filters.valid,
		),
		rows = query.data?.getSupportByAdmin;
	const [create] = useMutation(ADMIN_SUPPORT_CREATE),
		[update] = useMutation(ADMIN_SUPPORT_UPDATE),
		[reply] = useMutation(ADMIN_SUPPORT_REPLY);
	const [editor, setEditor] = useState<Editor | null>(null),
		[open, setOpen] = useState(false),
		[review, setReview] = useState(false),
		[busy, setBusy] = useState(false),
		[error, setError] = useState(''),
		[feedback, setFeedback] = useState('');
	const lock = useRef(false),
		pending = useRef<{ key: string; requestId: string; category: string } | null>(null);
	const begin = (row?: AdminSupportNotice) => {
		if (pending.current && !row) {
			setOpen(true);
			setReview(false);
			return;
		}
		if (pending.current) {
			setFeedback('Confirm the previous new notice before editing another record.');
			return;
		}
		setEditor({
			row,
			title: row?.noticeTitle || '',
			content: row?.noticeContent || '',
			response: row?.noticeResponse || '',
			status: row?.noticeStatus || NoticeStatus.HOLD,
		});
		setError('');
		setReview(false);
		setOpen(true);
	};
	const change = (field: keyof Editor, value: string) => {
		if (editor && !busy) {
			setEditor({ ...editor, [field]: value });
			setReview(false);
		}
	};
	const prepare = () => {
		if (!editor) return;
		if (
			inquiry
				? editor.response.trim().length < 10 || editor.response.trim().length > 2000
				: !publicNoticeInput(editor.title, editor.content)
		) {
			setError(
				inquiry ? 'Write a reply of 10–2,000 characters.' : 'Use a title of 3–100 and content of 10–2,000 characters.',
			);
			return;
		}
		if (
			pending.current &&
			pending.current.key !==
				JSON.stringify([editor.title.trim(), editor.content.trim(), editor.status, pending.current.category])
		) {
			setError('The previous notice may have been saved. Retry it unchanged before starting another.');
			return;
		}
		setError('');
		setReview(true);
	};
	const save = async () => {
		if (!editor || !review || lock.current || userVar().memberType !== MemberType.ADMIN) return;
		const actor = userVar()._id;
		lock.current = true;
		setBusy(true);
		setError('');
		setFeedback('');
		try {
			if (inquiry && editor.row) {
				await reply({
					variables: {
						input: {
							_id: editor.row._id,
							expectedRevision: editor.row.noticeRevision,
							noticeResponse: editor.response.trim(),
						},
					},
				});
			} else if (editor.row) {
				await update({
					variables: {
						input: {
							_id: editor.row._id,
							expectedRevision: editor.row.noticeRevision,
							...publicNoticeInput(editor.title, editor.content),
							noticeStatus: editor.status,
						},
					},
				});
			} else {
				const currentCategory = pending.current?.category || category,
					key = JSON.stringify([editor.title.trim(), editor.content.trim(), editor.status, currentCategory]);
				if (pending.current && pending.current.key !== key) throw Error('Changed payload');
				const requestId = pending.current?.requestId || globalThis.crypto?.randomUUID?.();
				if (!requestId) throw Error('Request unavailable');
				pending.current = { key, requestId, category: currentCategory };
				await create({
					variables: {
						input: {
							...publicNoticeInput(editor.title, editor.content),
							noticeStatus: editor.status,
							noticeCategory: currentCategory,
							requestId,
						},
					},
				});
			}
			if (userVar()._id !== actor) return;
			pending.current = null;
			setOpen(false);
			setEditor(null);
			setFeedback(inquiry ? 'Reply saved. The member can read it in Your messages.' : 'Notice saved.');
			await query.refetch().catch(() => setFeedback('Saved. Refresh to see the latest records.'));
		} catch {
			if (userVar()._id !== actor) return;
			if (!editor.row) {
				setError('We could not confirm the new notice. Retry unchanged to avoid a duplicate.');
				setReview(false);
			} else {
				setOpen(false);
				setFeedback(
					'The record changed or the save could not be confirmed. Check the refreshed record before trying again.',
				);
				await query.refetch().catch(() => {});
			}
		} finally {
			lock.current = false;
			setBusy(false);
		}
	};
	return (
		<>
			<AdminHeading
				title={inquiry ? 'Guest inquiries' : section === 'faq' ? 'Help, thoughtfully written.' : 'Platform notices'}
				description={
					inquiry
						? 'Private questions. Considered replies.'
						: section === 'faq'
						? 'Published guides for a smoother stay.'
						: 'Announcements and policies, kept current.'
				}
				action={
					!inquiry ? <Button onClick={() => begin()}>Add {section === 'faq' ? 'FAQ' : 'notice'} ↗</Button> : undefined
				}
			/>
			<AdminFilters
				section={section}
				filters={filters}
				extra={
					section === 'notice' ? (
						<Field
							select
							SelectProps={{ native: true }}
							InputLabelProps={{ shrink: true }}
							label="Category"
							value={filters.category || 'ANNOUNCEMENT'}
							onChange={(e) => filters.change({ category: e.target.value })}
						>
							<option value="ANNOUNCEMENT">Announcements</option>
							<option value="TERMS">Policies</option>
						</Field>
					) : undefined
				}
			/>
			{feedback && (
				<Alert severity={feedback.startsWith('The record') || feedback.startsWith('Confirm') ? 'warning' : 'success'}>
					{feedback}
				</Alert>
			)}
			<AdminState
				valid={filters.valid}
				loading={query.loading}
				error={query.error}
				empty={!rows?.list.length}
				refresh={() => query.refetch()}
			>
				<div className="h-admin-support-list">
					{rows?.list.map((row) => (
						<article key={row._id} className="h-admin-support-card">
							<div className="h-admin-story-meta">
								<span>{inquiry ? shortDate(row.createdAt) : label(row.noticeCategory)}</span>
								{inquiry ? (
									<Chip tone={row.noticeResponse ? 'success' : 'warning'}>
										{row.noticeResponse ? 'Replied' : 'Awaiting reply'}
									</Chip>
								) : (
									<Status value={row.noticeStatus} />
								)}
							</div>
							<h2>{row.noticeTitle}</h2>
							<p>{row.noticeContent}</p>
							{inquiry && row.noticeResponse && (
								<div className="h-admin-reply">
									<span className="h-eyebrow">Hotelia reply</span>
									<p>{row.noticeResponse}</p>
								</div>
							)}
							<div className="h-admin-support-footer">
								<small>
									{inquiry ? `Member reference ${row.memberId.slice(-8)}` : `Updated ${shortDate(row.updatedAt)}`}
								</small>
								<Button variant="outlined" disabled={busy} onClick={() => begin(row)}>
									{inquiry ? (row.noticeResponse ? 'Edit reply' : 'Reply') : 'Manage'}
								</Button>
							</div>
						</article>
					))}
				</div>
				<Pagination
					page={filters.page}
					total={rows?.metaCounter[0]?.total || 0}
					limit={10}
					onChange={(page) => filters.change({ page })}
				/>
			</AdminState>
			<Modal
				open={open}
				title={inquiry ? 'Reply to inquiry' : editor?.row ? 'Manage notice' : 'New notice'}
				onClose={() => {
					if (!lock.current) setOpen(false);
				}}
			>
				{editor && (
					<div className="h-admin-editor">
						{inquiry ? (
							<>
								<h3>{editor.title}</h3>
								<p>{editor.content}</p>
								<Field
									label="Reply"
									multiline
									minRows={5}
									value={editor.response}
									disabled={busy || review}
									inputProps={{ maxLength: 2000 }}
									onChange={(e) => change('response', e.target.value)}
								/>
							</>
						) : (
							<>
								<Field
									label="Title"
									value={editor.title}
									disabled={busy || review}
									inputProps={{ maxLength: 100 }}
									onChange={(e) => change('title', e.target.value)}
								/>
								<Field
									label="Content"
									multiline
									minRows={6}
									value={editor.content}
									disabled={busy || review}
									inputProps={{ maxLength: 2000 }}
									onChange={(e) => change('content', e.target.value)}
								/>
								<Field
									select
									SelectProps={{ native: true }}
									InputLabelProps={{ shrink: true }}
									label="Visibility"
									value={editor.status}
									disabled={busy || review}
									onChange={(e) => change('status', e.target.value)}
								>
									<option value="HOLD">Draft — private</option>
									<option value="ACTIVE">Published — public</option>
									{editor.row && <option value="DELETE">Archived — private</option>}
								</Field>
							</>
						)}
						{error && <Alert severity="error">{error}</Alert>}
						{review && (
							<Alert severity="info">
								{inquiry
									? 'This reply will be visible to the member who sent the inquiry.'
									: editor.status === 'ACTIVE'
									? 'This content will be visible to everyone in Help & support.'
									: editor.status === 'DELETE'
									? 'This notice will leave public Help & support. You can restore it from Archived.'
									: 'This draft will remain private.'}
							</Alert>
						)}
						<div className="h-admin-actions">
							{review ? (
								<>
									<Button variant="outlined" disabled={busy} onClick={() => setReview(false)}>
										Back to edit
									</Button>
									<Button disabled={busy} onClick={() => void save()}>
										{busy ? 'Saving…' : inquiry ? 'Confirm reply' : 'Confirm save'}
									</Button>
								</>
							) : (
								<Button disabled={busy} onClick={prepare}>
									Review {inquiry ? 'reply' : 'change'}
								</Button>
							)}
						</div>
					</div>
				)}
			</Modal>
		</>
	);
}
