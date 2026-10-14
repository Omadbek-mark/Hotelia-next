import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { ADMIN_MEMBERS, ADMIN_MEMBER_UPDATE } from '../../../apollo/admin/admin';
import { MemberStatus, MemberType } from '../../enums';
import { Members } from '../../types/contracts';
import { Button, Field, Pagination, SiteImage } from '../common/ui';
import { label } from '../../admin/model';
import {
	AdminFilters,
	AdminHeading,
	AdminState,
	StatusMenu,
	useAdminAction,
	useAdminFilters,
	useAdminList,
} from './shared';
export default function AdminMembers() {
	const user = useReactiveVar(userVar),
		filters = useAdminFilters('users'),
		query = useAdminList<{ getAllMembersByAdmin: Members }>(
			ADMIN_MEMBERS,
			{
				page: filters.page,
				limit: 10,
				sort: 'createdAt',
				direction: 'DESC',
				search: {
					...(filters.status ? { memberStatus: filters.status } : {}),
					...(filters.type ? { memberType: filters.type } : {}),
					...(filters.text ? { text: filters.text } : {}),
				},
			},
			filters.valid,
		),
		rows = query.data?.getAllMembersByAdmin,
		action = useAdminAction(ADMIN_MEMBER_UPDATE, () => query.refetch());
	return (
		<>
			<AdminHeading title="People of Hotelia" description="Guests, hotel owners and account access." />
			<AdminFilters
				section="users"
				filters={filters}
				extra={
					<Field
						select
						SelectProps={{ native: true }}
						InputLabelProps={{ shrink: true }}
						label="Role"
						value={filters.type}
						onChange={(e) => filters.change({ type: e.target.value })}
					>
						<option value="">All roles</option>
						{Object.values(MemberType).map((type) => (
							<option key={type} value={type}>
								{label(type)}
							</option>
						))}
					</Field>
				}
			/>
			{action.ui}
			<AdminState
				valid={filters.valid}
				loading={query.loading}
				error={query.error}
				empty={!rows?.list.length}
				refresh={() => query.refetch()}
			>
				<div className="h-admin-ledger">
					{rows?.list.map((m) => {
						const guarded =
							m._id === user._id || m.memberType === MemberType.ADMIN || m.memberStatus === MemberStatus.DELETE;
						return (
							<article className="h-admin-row" key={m._id}>
								<SiteImage src={m.memberImage || '/img/profile/defaultUser.svg'} alt={m.memberNick} className="h-admin-avatar" />
								<div className="h-admin-record">
									<h2>{m.memberNick}</h2>
									<p>{m.memberFullName || label(m.memberType)}</p>
									<small>
										{label(m.memberType)} · {m.memberHotels} hotels
									</small>
								</div>
								<StatusMenu
									value={m.memberStatus}
									name={m.memberNick}
									options={Object.values(MemberStatus)}
									disabled={guarded || action.busy}
									onChange={(status) =>
										action.open({
											title: `Set ${m.memberNick} to ${status.toLowerCase()}?`,
											description:
												status === MemberStatus.DELETE
													? 'Archive this account and remove access to signed-in features.'
													: status === MemberStatus.BLOCK
													? 'This account will lose access to signed-in features.'
													: 'This account can log in again.',
											variables: { input: { _id: m._id, memberStatus: status } },
										})
									}
								/>
								<div className="h-admin-actions">
									{guarded ? (
										<small>{m.memberType === MemberType.ADMIN ? 'Protected administrator' : 'Archived account'}</small>
									) : (
										<>
											<Button
												variant="outlined"
												disabled={
													action.busy ||
													m.memberStatus !== MemberStatus.ACTIVE ||
													(m.memberType === MemberType.HOTEL_OWNER && m.memberHotels > 0)
												}
												onClick={() => {
													const next = m.memberType === MemberType.USER ? MemberType.HOTEL_OWNER : MemberType.USER;
													action.open({
														title: `Change ${m.memberNick} to ${label(next)}?`,
														description:
															next === MemberType.HOTEL_OWNER
																? 'This account will have access to the hotel owner workspace.'
																: 'This account will use the guest workspace.',
														variables: { input: { _id: m._id, memberType: next } },
													});
												}}
											>
												Change role
											</Button>
										</>
									)}
								</div>
							</article>
						);
					})}
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
