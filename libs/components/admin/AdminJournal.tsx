import { ADMIN_JOURNAL, ADMIN_JOURNAL_UPDATE } from '../../../apollo/admin/admin';
import { BoardArticleStatus } from '../../enums';
import { BoardArticles } from '../../types/contracts';
import { Button, Pagination, SiteImage } from '../common/ui';
import { label } from '../../admin/model';
import {
	AdminFilters,
	AdminHeading,
	AdminState,
	Status,
	shortDate,
	useAdminAction,
	useAdminFilters,
	useAdminList,
} from './shared';
export default function AdminJournal() {
	const filters = useAdminFilters('journal'),
		query = useAdminList<{ getAllBoardArticlesByAdmin: BoardArticles }>(
			ADMIN_JOURNAL,
			{
				page: filters.page,
				limit: 10,
				sort: 'createdAt',
				direction: 'DESC',
				search: { ...(filters.status ? { articleStatus: filters.status } : {}) },
			},
			filters.valid,
		),
		rows = query.data?.getAllBoardArticlesByAdmin,
		action = useAdminAction(ADMIN_JOURNAL_UPDATE, () => query.refetch());
	return (
		<>
			<AdminHeading title="Journal moderation" description="Stories worth looking after." />
			<AdminFilters section="journal" filters={filters} />
			{action.ui}
			<AdminState
				valid={filters.valid}
				loading={query.loading}
				error={query.error}
				empty={!rows?.list.length}
				refresh={() => query.refetch()}
			>
				<div className="h-admin-journal-grid">
					{rows?.list.map((a) => (
						<article className="h-admin-story" key={a._id}>
							<SiteImage src={a.articleImage} alt={a.articleTitle} />
							<div>
								<div className="h-admin-story-meta">
									<span>{label(a.articleCategory)}</span>
									<Status value={a.articleStatus} />
								</div>
								<h2>{a.articleTitle}</h2>
								<p>{a.articleContent}</p>
								<small>
									{a.memberData?.memberNick || 'Member'} · {shortDate(a.createdAt)}
								</small>
								{a.articleStatus === BoardArticleStatus.ACTIVE && (
									<Button
										variant="outlined"
										disabled={action.busy}
										onClick={() =>
											action.open({
												title: 'Archive this story?',
												description: `“${a.articleTitle}” will leave the public journal. This interface cannot restore archived stories.`,
												variables: { input: { _id: a._id, articleStatus: BoardArticleStatus.DELETE } },
											})
										}
									>
										Archive story
									</Button>
								)}
							</div>
						</article>
					))}
				</div>
				<Pagination
					page={filters.page}
					total={rows?.metaCounter?.[0]?.total || 0}
					limit={10}
					onChange={(page) => filters.change({ page })}
				/>
			</AdminState>
		</>
	);
}
