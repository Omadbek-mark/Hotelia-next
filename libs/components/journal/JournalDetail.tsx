import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { ARTICLE, LIKE_ARTICLE } from '../../../apollo/user/journal';
import { useViewerRefresh } from '../../hooks/useViewerRefresh';
import { categories, storyText } from '../../journal/model';
import { isMemberId } from '../../social/query';
import { BoardArticle } from '../../types/contracts';
import { Button, EmptyState, SiteImage } from '../common/ui';
import JournalComments from './JournalComments';
export default function JournalDetail() {
	const router = useRouter(),
		user = useReactiveVar(userVar),
		id = router.query.articleId ?? router.query.id,
		valid = isMemberId(id),
		lock = useRef(false),
		[busy, setBusy] = useState(false),
		[error, setError] = useState('');
	const result = useQuery<{ getBoardArticle: BoardArticle }>(ARTICLE, {
		variables: { articleId: id },
		skip: !router.isReady || !valid,
		fetchPolicy: 'network-only',
	});
	useViewerRefresh(result.refetch, valid);
	const [like] = useMutation(LIKE_ARTICLE),
		article = result.data?.getBoardArticle;
	if (!router.isReady || result.loading)
		return (
			<div className="h-container">
				<EmptyState title="Opening the story…" />
			</div>
		);
	if (!valid || result.error || !article)
		return (
			<div className="h-container">
				<EmptyState
					title="Story unavailable"
					description="It may have been withdrawn."
					action={<Button href="/journal">Back to Journal</Button>}
				/>
			</div>
		);
	return (
		<article className="h-container h-journal-detail">
			<Link className="h-text-link" href="/journal">
				← Journal
			</Link>
			<header>
				<span className="h-eyebrow">{categories[article.articleCategory]}</span>
				<h1>{article.articleTitle}</h1>
				<div className="h-story-byline">
					<Link href={`/member?memberId=${article.memberId}`}>
						{article.memberData?.memberNick || 'Hotelia member'}
					</Link>
					<span>
						{new Date(article.createdAt).toLocaleDateString('en-US', {
							month: 'long',
							day: 'numeric',
							year: 'numeric',
						})}
					</span>
					<span>{article.articleViews} reads</span>
				</div>
			</header>
			<SiteImage className="h-story-hero" src={article.articleImage} alt={article.articleTitle} eager />
			<div className="h-story-body">
				<p className="h-story-text">{storyText(article.articleContent)}</p>
				<div className="h-journal-actions">
					<Button
						variant="outlined"
						disabled={busy}
						aria-pressed={!!article.meLiked?.[0]?.myFavorite}
						onClick={async () => {
							if (!user._id) {
								void router.push(`/account/join?referrer=${encodeURIComponent(router.asPath)}`);
								return;
							}
							if (lock.current) return;
							lock.current = true;
							setBusy(true);
							setError('');
							try {
								await like({ variables: { articleId: article._id } });
							} catch {
								setError('Like could not be confirmed.');
							} finally {
								try {
									await result.refetch();
								} catch {
									setError('Refresh the story to see your latest like.');
								}
								lock.current = false;
								setBusy(false);
							}
						}}
					>
						{article.meLiked?.[0]?.myFavorite ? '♥ Liked' : '♡ Like'} · {article.articleLikes}
					</Button>
					{article.memberId === user._id && (
						<Button variant="text" href={`/account?category=writeArticle&articleId=${article._id}`}>
							Edit story
						</Button>
					)}
				</div>
				{error && <p role="alert">{error}</p>}
				<aside className="h-story-author">
					<SiteImage src={article.memberData?.memberImage || '/img/profile/defaultUser.svg'} alt="Author portrait" />
					<div>
						<span className="h-eyebrow">Written by</span>
						<h2>{article.memberData?.memberNick}</h2>
						<p>{article.memberData?.memberDesc}</p>
						<Link href={`/member?memberId=${article.memberId}&tab=articles`} className="h-text-link">
							View author →
						</Link>
					</div>
				</aside>
				<JournalComments key={`${article._id}:${user._id}`} articleId={article._id} onChange={() => result.refetch()} />
			</div>
		</article>
	);
}
