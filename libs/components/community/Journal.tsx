import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { JOURNAL, UPDATE_ARTICLE } from '../../../apollo/user/journal';
import { categories, storyText } from '../../journal/model';
import { socialHref, socialPage } from '../../social/query';
import { BoardArticle, BoardArticles, BoardArticlesInquiry } from '../../types/contracts';
import { BoardArticleCategory, BoardArticleStatus, Direction } from '../../enums';
import { Button, CardSkeletons, EmptyState, Field, Modal, Pagination, SiteImage } from '../common/ui';
export function JournalCard({
	article,
	own = false,
	onDelete,
}: {
	article: BoardArticle;
	own?: boolean;
	onDelete?: () => void;
}) {
	return (
		<article className="h-journal-card">
			<Link href={`/community/detail?articleId=${article._id}`}>
				<SiteImage src={article.articleImage} alt={article.articleTitle} />
				<div className="h-journal-card-copy">
					<span className="h-eyebrow">{categories[article.articleCategory]}</span>
					<h2>{article.articleTitle}</h2>
					<p>{storyText(article.articleContent)}</p>
				</div>
			</Link>
			<div className="h-journal-card-meta">
				<Link href={`/member?memberId=${article.memberId}`}>{article.memberData?.memberNick || 'Hotelia member'}</Link>
				<span>
					{new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
				</span>
			</div>
			{own && (
				<div className="h-journal-actions">
					<span>
						{article.articleViews} reads · {article.articleLikes} likes · {article.articleComments} comments
					</span>
					<Button variant="text" href={`/mypage?category=writeArticle&articleId=${article._id}`}>
						Edit
					</Button>
					<Button variant="text" onClick={onDelete}>
						Remove
					</Button>
				</div>
			)}
		</article>
	);
}
export default function Journal({ own = false }: { own?: boolean }) {
	const router = useRouter(),
		user = useReactiveVar(userVar);
	const page = socialPage(router.query.page),
		category = router.query.topic;
	const valid =
		!!page &&
		(category === undefined ||
			(typeof category === 'string' && Object.prototype.hasOwnProperty.call(categories, category))) &&
		(router.query.text === undefined || (typeof router.query.text === 'string' && router.query.text.length <= 100));
	const [text, setText] = useState(typeof router.query.text === 'string' ? router.query.text : ''),
		[remove, setRemove] = useState<BoardArticle>(),
		[message, setMessage] = useState('');
	const input: BoardArticlesInquiry = {
		page: page || 1,
		limit: 6,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: {
			...(own ? { memberId: user._id } : {}),
			...(category ? { articleCategory: category as BoardArticleCategory } : {}),
			...(router.query.text ? { text: router.query.text as string } : {}),
		},
	};
	const result = useQuery<{ getBoardArticles: BoardArticles }>(JOURNAL, {
		variables: { input },
		skip: !router.isReady || !valid || (own && !user._id),
		fetchPolicy: 'network-only',
	});
	useEffect(() => {
		setText(typeof router.query.text === 'string' ? router.query.text : '');
	}, [router.query.text]);
	const removalLock = useRef(false);
	const [update, { loading: removing }] = useMutation(UPDATE_ARTICLE);
	const change = (patch: Record<string, string | undefined>) =>
		router.push(socialHref(router.pathname, { ...router.query, ...patch }), undefined, { scroll: false });
	const list = result.data?.getBoardArticles.list || [],
		total = result.data?.getBoardArticles.metaCounter?.[0]?.total || 0;
	return (
		<section className={own ? 'h-journal h-journal-own' : 'h-container h-journal'}>
			<header className="h-journal-heading">
				<div>
					<span className="h-eyebrow">{own ? 'Author desk' : 'Dispatches & observations'}</span>
					<h1>{own ? 'My Articles' : 'The Hotelia Journal'}</h1>
					<p>{own ? 'Your published stories, all in one place.' : 'Quiet places. Fresh perspectives.'}</p>
				</div>
				<Button href="/mypage?category=writeArticle">Write a story ↗</Button>
			</header>
			<div className="h-journal-toolbar">
				<nav aria-label="Journal categories">
					<Button
						variant={!category ? 'contained' : 'text'}
						onClick={() => change({ topic: undefined, page: undefined })}
					>
						All
					</Button>
					{Object.entries(categories).map(([key, label]) => (
						<Button
							key={key}
							variant={category === key ? 'contained' : 'text'}
							onClick={() => change({ topic: key, page: undefined })}
						>
							{label}
						</Button>
					))}
				</nav>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						void change({ text: text.trim() || undefined, page: undefined });
					}}
				>
					<Field
						label="Search stories"
						value={text}
						onChange={(e) => setText(e.target.value)}
						inputProps={{ maxLength: 100 }}
					/>
					<Button type="submit" variant="text">
						Search
					</Button>
				</form>
			</div>
			{!valid ? (
				<EmptyState
					title="Invalid journal filters"
					action={<Button href={own ? '/mypage?category=myArticles' : '/community'}>Reset filters</Button>}
				/>
			) : result.loading ? (
				<CardSkeletons />
			) : result.error ? (
				<EmptyState
					error
					title="Stories could not be loaded"
					action={<Button onClick={() => void result.refetch()}>Try again</Button>}
				/>
			) : !list.length ? (
				<EmptyState
					title={own ? 'Your first story starts here' : 'No stories yet'}
					description="Share a place worth remembering."
				/>
			) : (
				<>
					<div className="h-journal-grid">
						{list.map((article) => (
							<JournalCard
								key={article._id}
								article={article}
								own={own}
								onDelete={() => {
									setMessage('');
									setRemove(article);
								}}
							/>
						))}
					</div>
					<Pagination page={page || 1} total={total} limit={6} onChange={(p) => void change({ page: String(p) })} />
				</>
			)}
			<Modal
				title="Remove this story?"
				open={!!remove}
				onClose={() => {
					if (!removing) setRemove(undefined);
				}}
			>
				<p>It will be withdrawn from the Journal.</p>
				{message && <p role="alert">{message}</p>}
				<div className="h-journal-actions">
					<Button variant="text" disabled={removing} onClick={() => setRemove(undefined)}>
						Keep story
					</Button>
					<Button
						disabled={removing}
						onClick={async () => {
							if (!remove || removalLock.current) return;
							removalLock.current = true;
							try {
								await update({ variables: { input: { _id: remove._id, articleStatus: BoardArticleStatus.DELETE } } });
								setRemove(undefined);
								await result.refetch();
							} catch {
								setMessage('Removal could not be confirmed. Refresh your articles before trying again.');
							} finally {
								removalLock.current = false;
							}
						}}
					>
						{removing ? 'Removing…' : 'Remove story'}
					</Button>
				</div>
			</Modal>
		</section>
	);
}
