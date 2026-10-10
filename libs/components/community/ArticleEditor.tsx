import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { ARTICLE, CREATE_ARTICLE, UPDATE_ARTICLE } from '../../../apollo/user/journal';
import { uploadImage } from '../../api/upload';
import { articleInput, categories, storyText } from '../../journal/model';
import { isMemberId } from '../../social/query';
import { BoardArticle } from '../../types/contracts';
import { BoardArticleCategory } from '../../enums';
import { Button, EmptyState, Field, SiteImage } from '../common/ui';
function EditorForm({ article }: { article?: BoardArticle }) {
	const router = useRouter(),
		user = useReactiveVar(userVar),
		owner = useRef(user._id);
	const [title, setTitle] = useState(article?.articleTitle || ''),
		[content, setContent] = useState(article?.articleContent || ''),
		[image, setImage] = useState(article?.articleImage || ''),
		[category, setCategory] = useState(article?.articleCategory || BoardArticleCategory.FREE);
	const [error, setError] = useState(''),
		[busy, setBusy] = useState(false),
		[uncertain, setUncertain] = useState(false),
		lock = useRef(false);
	const [publish] = useMutation(CREATE_ARTICLE),
		[update] = useMutation(UPDATE_ARTICLE);
	const submit = async () => {
		if (lock.current || uncertain) return;
		setError('');
		let input;
		try {
			input = articleInput(title, content, image, category);
		} catch (e) {
			setError((e as Error).message);
			return;
		}
		if (user._id !== owner.current || !user._id) {
			setError('Sign in again before publishing.');
			return;
		}
		lock.current = true;
		setBusy(true);
		try {
			const response = article
				? await update({
						variables: {
							input: {
								_id: article._id,
								articleTitle: input.articleTitle,
								articleContent: input.articleContent,
								articleImage: input.articleImage,
							},
						},
				  })
				: await publish({ variables: { input } });
			const id = article ? article._id : response.data?.createBoardArticle?._id;
			if (!id) throw new Error();
			await router.push(`/community/detail?articleId=${id}`);
		} catch {
			setUncertain(true);
			setError('Your changes could not be confirmed. Check My Articles before submitting again.');
		} finally {
			lock.current = false;
			setBusy(false);
		}
	};
	return (
		<section className="h-journal-editor">
			<header className="h-journal-heading">
				<div>
					<span className="h-eyebrow">Journal dispatch</span>
					<h1>{article ? 'Edit your story' : 'Write a story'}</h1>
					<p>A small moment worth sharing.</p>
				</div>
				<Button onClick={submit} disabled={busy || uncertain}>
					{busy ? 'Saving…' : article ? 'Save changes' : 'Publish story'}
				</Button>
			</header>
			<div className="h-editor-grid">
				<div className="h-editor-fields">
					<Field
						label="Category"
						select
						value={category}
						disabled={!!article || busy}
						SelectProps={{ native: true }}
						onChange={(e) => setCategory(e.target.value as BoardArticleCategory)}
					>
						{Object.entries(categories).map(([key, label]) => (
							<option key={key} value={key}>
								{label}
							</option>
						))}
					</Field>
					<Field
						label="Story title"
						value={title}
						disabled={busy}
						onChange={(e) => setTitle(e.target.value)}
						inputProps={{ maxLength: 50 }}
						helperText={`${title.trim().length} / 50`}
					/>
					<div className="h-editor-cover">
						<span className="h-eyebrow">Cover photograph</span>
						{image && <SiteImage src={image} alt="Story cover" />}
						<Button component="label" variant="outlined" disabled={busy}>
							{image ? 'Replace photo' : 'Choose a photo'}
							<input
								hidden
								type="file"
								accept="image/jpeg,image/png"
								onChange={async (e) => {
									const file = e.target.files?.[0];
									e.target.value = '';
									if (!file || lock.current) return;
									lock.current = true;
									setBusy(true);
									setError('');
									try {
										const path = await uploadImage(file, 'article');
										if (userVar()._id === owner.current) setImage(path);
									} catch (e) {
										setError((e as Error).message);
									} finally {
										setBusy(false);
										lock.current = false;
									}
								}}
							/>
						</Button>
						{image && (
							<Button variant="text" disabled={busy} onClick={() => setImage('')}>
								Remove photo
							</Button>
						)}
						<small>JPG or PNG · up to 15 MB</small>
					</div>
					<Field
						label="Story"
						multiline
						minRows={6}
						value={content}
						disabled={busy}
						onChange={(e) => setContent(e.target.value)}
						inputProps={{ maxLength: 250 }}
						helperText={`${content.trim().length} / 250 characters`}
					/>
					{error && <p role="alert">{error}</p>}
					<div className="h-journal-actions">
						<Button variant="text" href="/mypage?category=myArticles">
							My Articles
						</Button>
						<Button disabled={busy || uncertain} onClick={submit}>
							{article ? 'Save changes' : 'Publish story'}
						</Button>
					</div>
				</div>
				<aside className="h-editor-preview">
					<span className="h-eyebrow">Reader preview</span>
					<SiteImage src={image} alt="Story preview" />
					<span className="h-eyebrow">{categories[category]}</span>
					<h2>{title || 'Your story begins here'}</h2>
					<p className="h-story-text">{storyText(content) || 'Let the place do the talking.'}</p>
					<small>By {user.memberNick}</small>
				</aside>
			</div>
		</section>
	);
}
export default function ArticleEditor() {
	const router = useRouter(),
		user = useReactiveVar(userVar),
		id = router.query.articleId,
		valid = id === undefined || isMemberId(id);
	const result = useQuery<{ getBoardArticle: BoardArticle }>(ARTICLE, {
		variables: { articleId: id },
		skip: !router.isReady || !id || !valid,
		fetchPolicy: 'network-only',
	});
	if (!valid) return <EmptyState title="Invalid story link" />;
	if (!router.isReady || (id && result.loading)) return <EmptyState title="Opening your story…" />;
	if (id && (result.error || !result.data?.getBoardArticle || result.data.getBoardArticle.memberId !== user._id))
		return (
			<EmptyState
				title="This story cannot be edited"
				description="Open one of your published stories from My Articles."
			/>
		);
	return <EditorForm key={`${user._id}:${id || 'new'}`} article={result.data?.getBoardArticle} />;
}
