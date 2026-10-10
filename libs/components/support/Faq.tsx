import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { GET_SUPPORT_NOTICES } from '../../../apollo/user/support';
import { NoticeCategory } from '../../enums';
import { guides } from '../../support/model';
import { SupportNotices } from '../../types/contracts';
import { Button, EmptyState, Field, Pagination } from '../common/ui';
export default function Faq({ page, onPage }: { page: number; onPage: (page: number) => void }) {
	const [search, setSearch] = useState(''),
		[topic, setTopic] = useState('All');
	const result = useQuery<{ getSupportNotices: SupportNotices }>(GET_SUPPORT_NOTICES, {
		variables: { input: { page, limit: 10, noticeCategory: NoticeCategory.FAQ } },
		notifyOnNetworkStatusChange: true,
	});
	const visible = guides.filter(
		(g) =>
			(topic === 'All' || g.topic === topic) &&
			`${g.title} ${g.content}`.toLowerCase().includes(search.trim().toLowerCase()),
	);
	return (
		<>
			<div className="h-support-search">
				<Field label="Search answers" value={search} onChange={(e) => setSearch(e.target.value)} />
			</div>
			<nav className="h-support-topics" aria-label="FAQ topics">
				{['All', 'Booking', 'Hosting', 'Account', 'Reviews'].map((t) => (
					<Button key={t} variant={topic === t ? 'contained' : 'text'} onClick={() => setTopic(t)}>
						{t}
					</Button>
				))}
			</nav>
			<div>
				{visible.length ? (
					visible.map((g, i) => (
						<details className="h-support-answer" key={g.title}>
							<summary>
								<span className="h-support-index">{String(i + 1).padStart(2, '0')}</span>
								<h2>{g.title}</h2>
								<span aria-hidden>+</span>
							</summary>
							<p>{g.content}</p>
						</details>
					))
				) : (
					<EmptyState
						title="No matching answers"
						action={
							<Button
								variant="outlined"
								onClick={() => {
									setSearch('');
									setTopic('All');
								}}
							>
								Clear search
							</Button>
						}
					/>
				)}
			</div>
			{result.error ? (
				<EmptyState
					error
					title="Published FAQs are unavailable"
					description="The quick answers above are still available."
					action={<Button onClick={() => void result.refetch()}>Retry</Button>}
				/>
			) : result.loading ? (
				<p role="status">Checking for published FAQs…</p>
			) : (
				!!result.data?.getSupportNotices.list.length && (
					<section className="h-support-published">
						<span className="h-eyebrow">More from Hotelia</span>
						{result.data.getSupportNotices.list.map((n) => (
							<details key={n._id} className="h-support-answer">
								<summary>
									<h2>{n.noticeTitle}</h2>
									<span aria-hidden>+</span>
								</summary>
								<p>{n.noticeContent}</p>
							</details>
						))}
						<Pagination
							page={page}
							total={result.data.getSupportNotices.metaCounter?.[0]?.total || 0}
							limit={10}
							onChange={onPage}
						/>
					</section>
				)
			)}
		</>
	);
}
