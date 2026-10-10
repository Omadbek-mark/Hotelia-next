import { useReactiveVar } from '@apollo/client';
import { useReadyRouter as useRouter } from '../../hooks/useReadyRouter';
import { userVar } from '../../../apollo/store';
import { NoticeCategory } from '../../enums';
import { socialHref, socialPage } from '../../social/query';
import { supportTabs } from '../../support/model';
import { Button, EmptyState } from '../common/ui';
import SessionGate from '../common/SessionGate';
import PublicLayout from '../layout/PublicLayout';
import Faq from './Faq';
import Inquiries from './Inquiries';
import NoticeList from './NoticeList';
import Notifications from './Notifications';
const labels = {
	faq: 'Quick answers',
	notices: 'Platform notices',
	inquiries: 'Your messages',
	notifications: 'Notifications',
};
export default function SupportPage() {
	const router = useRouter(),
		user = useReactiveVar(userVar),
		tab = router.query.tab || 'faq',
		page = socialPage(router.query.page),
		category = router.query.noticeCategory || NoticeCategory.ANNOUNCEMENT;
	const valid =
		typeof tab === 'string' &&
		supportTabs.includes(tab as typeof supportTabs[number]) &&
		!!page &&
		typeof category === 'string' &&
		[NoticeCategory.ANNOUNCEMENT, NoticeCategory.TERMS].includes(category as NoticeCategory);
	const navigate = (values: Record<string, string | undefined>) =>
		void router.push(socialHref('/support', { ...router.query, ...values }), undefined, { scroll: false });
	return (
		<PublicLayout title="Help & support">
			<section className="h-container h-support">
				<header className="h-support-heading">
					<span className="h-eyebrow">A calm place for answers</span>
					<h1>Here to help.</h1>
					<p>Your stay. Your account. A little guidance.</p>
				</header>
				<div className="h-support-layout">
					<aside>
						<nav aria-label="Support navigation">
							{supportTabs.map((t) => (
								<Button
									key={t}
									variant={tab === t ? 'contained' : 'text'}
									onClick={() => navigate({ tab: t, page: undefined, noticeCategory: undefined })}
								>
									{labels[t]}
								</Button>
							))}
						</nav>
						<div className="h-support-aside">
							<span className="h-eyebrow">Still wondering?</span>
							<p>Send a private message from your account.</p>
							<Button variant="outlined" onClick={() => navigate({ tab: 'inquiries', page: undefined })}>
								Ask Hotelia ↗
							</Button>
						</div>
					</aside>
					<div className="h-support-content">
						{!router.isReady ? (
							<EmptyState title="Opening support…" />
						) : !valid ? (
							<EmptyState error title="Check your support link" action={<Button href="/support">Start fresh</Button>} />
						) : tab === 'faq' ? (
							<Faq page={page!} onPage={(p) => navigate({ page: String(p) })} />
						) : tab === 'notices' ? (
							<>
								<nav className="h-support-topics" aria-label="Notice categories">
									{[
										[NoticeCategory.ANNOUNCEMENT, 'Announcements'],
										[NoticeCategory.TERMS, 'Policies'],
									].map(([v, label]) => (
										<Button
											key={v}
											variant={category === v ? 'contained' : 'text'}
											onClick={() => navigate({ noticeCategory: v, page: undefined })}
										>
											{label}
										</Button>
									))}
								</nav>
								<NoticeList
									category={category as NoticeCategory}
									page={page!}
									onPage={(p) => navigate({ page: String(p) })}
								/>
							</>
						) : (
							<SessionGate>
								<div key={user._id}>
									{tab === 'inquiries' ? (
										<Inquiries page={page!} onPage={(p) => navigate({ page: String(p) })} />
									) : (
										<Notifications page={page!} onPage={(p) => navigate({ page: String(p) })} />
									)}
								</div>
							</SessionGate>
						)}
					</div>
				</div>
			</section>
		</PublicLayout>
	);
}
