import { useMutation, useReactiveVar } from '@apollo/client';
import { Alert, Skeleton } from '@mui/material';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { userVar } from '../../../apollo/store';
import { CREATE_HOTEL_COMMENT } from '../../../apollo/user/hotel-detail';
import { CommentGroup } from '../../enums';
import type { Comment, Comments } from '../../types/contracts';
import { Button, Field, Pagination, SiteImage } from '../common/ui';

export default function HotelComments({ hotelId, data, loading, failed, page, setPage, refresh }: {
	hotelId: string; data?: Comments; loading: boolean; failed: boolean; page: number;
	setPage: (page: number) => void; refresh: (firstPage?: boolean) => Promise<unknown>;
}) {
	const user = useReactiveVar(userVar);
	const [create] = useMutation<{ createComment: Comment }>(CREATE_HOTEL_COMMENT);
	const [content, setContent] = useState(''), [pending, setPending] = useState(false);
	const [error, setError] = useState(''), [saved, setSaved] = useState(false);
	const lock = useRef(false), context = useRef('');
	context.current = `${hotelId}:${user._id}`;
	useEffect(() => { setContent(''); setError(''); setSaved(false); }, [hotelId, user._id]);
	const submit = async (event: FormEvent) => {
		event.preventDefault();
		const text = content.trim(), identity = context.current;
		if (lock.current || !user._id) return;
		if (!text || text.length > 100) { setError('Write a comment of 1–100 characters.'); return; }
		lock.current = true; setPending(true); setError(''); setSaved(false);
		try {
			const result = await create({ variables: { input: { commentGroup: CommentGroup.HOTEL, commentRefId: hotelId, commentContent: text } } });
			if (!result.data?.createComment?._id) throw new Error('No comment response');
			if (context.current !== identity) return;
			setContent(''); setSaved(true); setPage(1);
			try { await refresh(true); } catch { setError('Comment saved. Refresh the list to see it.'); }
		} catch {
			if (context.current === identity) setError('Could not confirm your comment. Refresh the list before retrying.');
		} finally { lock.current = false; setPending(false); }
	};
	const total = data?.metaCounter?.[0]?.total || 0;
	return <section className="h-detail-section h-hotel-comments" id="guest-reviews">
		<div className="h-detail-section-title"><h2>Comments <span className="h-comment-total">{total}</span></h2><span className="h-eyebrow">Around this stay</span></div>
		{loading && !data ? <Skeleton height={100} /> : failed ? <Alert severity="error">Comments could not load. <Button variant="text" onClick={() => refresh().catch(() => {})}>Try again</Button></Alert> :
			!data?.list.length ? <p className="h-comments-empty">Start the conversation about this hotel.</p> : <div className="h-hotel-comment-list">
				{data.list.map(comment => <article className="h-hotel-comment" key={comment._id}>
					<SiteImage src={comment.memberData?.memberImage || '/img/profile/defaultUser.svg'} alt="" />
					<div><div className="h-comment-meta"><strong>{comment.memberData?.memberNick || 'Hotelia guest'}</strong><time dateTime={String(comment.createdAt)}>{new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>{comment.bookingId && <span className="h-comment-verified">Verified stay{comment.rating != null ? ` · ★ ${comment.rating}` : ''}</span>}</div><p>{comment.commentContent}</p></div>
				</article>)}
			</div>}
		{!failed && <Pagination page={page} limit={4} total={total} onChange={setPage} />}
		<div className="h-hotel-comment-compose">
			{user._id ? <form onSubmit={submit} aria-busy={pending}>
				<div className="h-comment-compose-heading"><SiteImage src={user.memberImage || '/img/profile/defaultUser.svg'} alt="" /><strong>Join the conversation</strong></div>
				<Field label="Your comment" multiline minRows={2} value={content} disabled={pending} onChange={event => { setContent(event.target.value); setSaved(false); }} inputProps={{ maxLength: 100 }} helperText={`${content.length}/100`} />
				<div className="h-comment-compose-footer"><span>Share a thought. Keep it kind.</span><Button type="submit" color="secondary" disabled={pending || !content.trim()}>{pending ? 'Posting…' : 'Post comment'}</Button></div>
			</form> : <div className="h-comment-login"><span>Have something to share?</span><Link href={{ pathname: '/account/join', query: { referrer: `/hotel/detail?hotelId=${hotelId}#guest-reviews` } }}>Log in to comment ↗</Link></div>}
			{saved && <p className="h-comment-success" role="status">Comment posted.</p>}
			{error && <Alert severity="error">{error}</Alert>}
		</div>
	</section>;
}
