import { useQuery } from '@apollo/client';
import { GET_SUPPORT_NOTICES } from '../../../apollo/user/support';
import { NoticeCategory } from '../../enums';
import { SupportNotices } from '../../types/contracts';
import { Button, EmptyState, Pagination } from '../common/ui';
export default function NoticeList({
	category,
	page,
	onPage,
}: {
	category?: NoticeCategory;
	page: number;
	onPage: (page: number) => void;
}) {
	const result = useQuery<{ getSupportNotices: SupportNotices }>(GET_SUPPORT_NOTICES, {
		variables: { input: { page, limit: 10, ...(category ? { noticeCategory: category } : {}) } },
		notifyOnNetworkStatusChange: true,
	});
	if (result.loading) return <EmptyState title="Opening the latest notices…" />;
	if (result.error)
		return (
			<EmptyState
				error
				title="Notices are taking a moment"
				action={<Button onClick={() => void result.refetch()}>Retry</Button>}
			/>
		);
	const notices = result.data?.getSupportNotices;
	return (
		<>
			<div className="h-support-notices">
				{notices?.list.length ? (
					notices.list.map((notice) => (
						<details key={notice._id} className="h-support-answer">
							<summary>
								<span>
									<small>
										{notice.noticeCategory === NoticeCategory.FAQ
											? 'FAQ'
											: notice.noticeCategory === NoticeCategory.TERMS
											? 'Policy'
											: 'Announcement'}{' '}
										·{' '}
										{new Date(notice.createdAt).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric',
											timeZone: 'UTC',
										})}
									</small>
									<h2>{notice.noticeTitle}</h2>
								</span>
								<span aria-hidden>+</span>
							</summary>
							<p>{notice.noticeContent}</p>
						</details>
					))
				) : (
					<EmptyState title="You’re up to date" description="No published notices here yet." />
				)}
			</div>
			<Pagination page={page} total={notices?.metaCounter?.[0]?.total || 0} limit={10} onChange={onPage} />
		</>
	);
}
