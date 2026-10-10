import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { COMMENTS, CREATE_COMMENT, UPDATE_COMMENT } from '../../../apollo/user/journal';
import { Comments } from '../../types/contracts';
import { CommentGroup, CommentStatus, Direction } from '../../enums';
import { Button, EmptyState, Field, Modal, Pagination } from '../common/ui';
export default function JournalComments({
	articleId,
	onChange,
}: {
	articleId: string;
	onChange: () => Promise<unknown>;
}) {
	const user = useReactiveVar(userVar),
		[page, setPage] = useState(1),
		[content, setContent] = useState(''),
		[edit, setEdit] = useState<{ id: string; text: string }>(),
		[remove, setRemove] = useState<string>(),
		[error, setError] = useState(''),
		[busy, setBusy] = useState(false),
		lock = useRef(false);
	const result = useQuery<{ getComments: Comments }>(COMMENTS, {
		variables: {
			input: {
				page,
				limit: 6,
				sort: 'createdAt',
				direction: Direction.DESC,
				search: { commentRefId: articleId, commentGroup: CommentGroup.ARTICLE },
			},
		},
		fetchPolicy: 'network-only',
	});
	const [create] = useMutation(CREATE_COMMENT),
		[update] = useMutation(UPDATE_COMMENT);
	const mutate = async (mode: 'create' | 'edit' | 'delete') => {
		if (lock.current) return;
		const text = (mode === 'edit' ? edit?.text || '' : content).trim();
		if (mode !== 'delete' && (!text || text.length > 100)) {
			setError('Write 1–100 characters.');
			return;
		}
		if (!user._id) return;
		lock.current = true;
		setBusy(true);
		setError('');
		try {
			if (mode === 'create')
				await create({
					variables: { input: { commentGroup: CommentGroup.ARTICLE, commentRefId: articleId, commentContent: text } },
				});
			else
				await update({
					variables: {
						input:
							mode === 'delete'
								? { _id: remove, commentStatus: CommentStatus.DELETE }
								: { _id: edit?.id, commentContent: text },
					},
				});
			if (mode === 'create') setContent('');
			setEdit(undefined);
			setRemove(undefined);
			await Promise.all([result.refetch(), onChange()]);
		} catch {
			setError('Changes could not be confirmed. Refresh comments before retrying.');
		} finally {
			lock.current = false;
			setBusy(false);
		}
	};
	const total = result.data?.getComments.metaCounter?.[0]?.total || 0;
	return (
		<section className="h-journal-comments">
			<span className="h-eyebrow">Community dialogue</span>
			<h2>Comments ({total})</h2>
			{user._id ? (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						void mutate('create');
					}}
				>
					<Field
						label="Your observation"
						multiline
						minRows={2}
						value={content}
						disabled={busy}
						onChange={(e) => setContent(e.target.value)}
						inputProps={{ maxLength: 100 }}
						helperText={`${content.trim().length} / 100`}
					/>
					<Button type="submit" disabled={busy}>
						Post comment
					</Button>
				</form>
			) : (
				<Button href={`/account/join?referrer=${encodeURIComponent(`/community/detail?articleId=${articleId}`)}`}>
					Sign in to comment
				</Button>
			)}
			{error && <p role="alert">{error}</p>}
			{result.loading ? (
				<p role="status">Loading comments…</p>
			) : result.error ? (
				<EmptyState
					error
					title="Comments unavailable"
					action={<Button onClick={() => void result.refetch()}>Refresh comments</Button>}
				/>
			) : !total ? (
				<p>No comments yet. Start the conversation.</p>
			) : (
				result.data?.getComments.list.map((comment) => (
					<article className="h-journal-comment" key={comment._id}>
						<header>
							<strong>{comment.memberData?.memberNick || 'Hotelia member'}</strong>
							<small>{new Date(comment.createdAt).toLocaleDateString()}</small>
						</header>
						<p>{comment.commentContent}</p>
						{comment.memberId === user._id && (
							<div>
								<Button
									variant="text"
									disabled={busy}
									onClick={() => setEdit({ id: comment._id, text: comment.commentContent })}
								>
									Edit comment
								</Button>
								<Button variant="text" disabled={busy} onClick={() => setRemove(comment._id)}>
									Remove comment
								</Button>
							</div>
						)}
					</article>
				))
			)}
			<Pagination page={page} total={total} limit={6} onChange={setPage} />
			<Modal
				title={remove ? 'Remove comment?' : 'Edit comment'}
				open={!!remove || !!edit}
				onClose={() => {
					if (!busy) {
						setRemove(undefined);
						setEdit(undefined);
					}
				}}
			>
				{edit && (
					<Field
						label="Comment"
						multiline
						value={edit.text}
						inputProps={{ maxLength: 100 }}
						onChange={(e) => setEdit({ ...edit, text: e.target.value })}
					/>
				)}
				{error && <p role="alert">{error}</p>}
				<Button disabled={busy} onClick={() => void mutate(remove ? 'delete' : 'edit')}>
					{remove ? 'Remove comment' : 'Save comment'}
				</Button>
			</Modal>
		</section>
	);
}
