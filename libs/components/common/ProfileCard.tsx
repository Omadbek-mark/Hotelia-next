import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import MemberLikeButton from './MemberLikeButton';
import { useReactiveVar } from '@apollo/client';
import { useState } from 'react';
import Link from 'next/link';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { userVar } from '../../../apollo/store';
import type { PublicProfile } from '../../../apollo/user/social';
import { isFollowing } from '../../social/query';
import FollowButton from './FollowButton';
import ConnectionsDialog from '../account/ConnectionsDialog';
import { Button, SiteImage } from './ui';

type CardMember = Pick<PublicProfile, '_id' | 'memberNick'> &
	Partial<Omit<PublicProfile, 'memberType' | 'memberStatus'>> & { memberType?: string; memberStatus?: string };
export default function ProfileCard({
	member,
	onEdit,
	heading = false,
	profileHref,
	portrait = true,
}: {
	member: CardMember;
	onEdit?: () => void;
	heading?: boolean;
	profileHref?: string;
	portrait?: boolean;
}) {
	const user = useReactiveVar(userVar);
	const [network, setNetwork] = useState<'followers' | 'followings' | null>(null);
	const name = member.memberFullName?.trim() || member.memberNick;
	const own = member._id === user._id;
	const role =
		member.memberType === 'HOTEL_OWNER' ? 'Hotel owner' : member.memberType === 'ADMIN' ? 'Admin' : 'Traveler';
	const href =
		(own ? '/account?category=myProfile' : profileHref) ||
		(member.memberType === 'HOTEL_OWNER'
			? `/hotel-owner/detail?ownerId=${member._id}`
			: `/member?memberId=${member._id}`);
	const Heading = heading ? 'h1' : 'h2';
	const count = (value?: number) => (value == null ? '—' : value.toLocaleString('en-US'));
	return (
		<>
			<article className={`h-person-card${portrait ? ' h-person-card--portrait' : ''}${!member.memberImage ? ' h-person-card--default-avatar' : ''}`}>
				{portrait && (own ? (
					<SiteImage className="h-person-portrait" src={member.memberImage || '/img/profile/defaultUser.svg'} alt="" />
				) : (
					<Link className="h-person-portrait-link" href={href} aria-label={`View ${name}'s profile`}>
						<SiteImage className="h-person-portrait" src={member.memberImage || '/img/profile/defaultUser.svg'} alt="" />
					</Link>
				))}
				<div className="h-person-cover" aria-hidden="true" />
				<div className="h-person-action">
					{own ? (
						onEdit ? (
							<Button variant="outlined" onClick={onEdit} startIcon={<EditOutlinedIcon />}>
								Edit profile
							</Button>
						) : (
							<span className="h-person-you">You</span>
						)
					) : (
						<FollowButton memberId={member._id} following={isFollowing(member.meFollowed, user._id, member._id)} />
					)}
				</div>
				<div className="h-person-body">
					<div className="h-person-identity">
						{own ? (
							<SiteImage src={member.memberImage || '/img/profile/defaultUser.svg'} alt={name} />
						) : (
							<Link href={href} aria-label={`View ${name}'s profile`}>
								<SiteImage src={member.memberImage || '/img/profile/defaultUser.svg'} alt={name} />
							</Link>
						)}

					</div>
					<Heading>{onEdit || (heading && !own) ? name : <Link href={href}>{name}</Link>}</Heading>
					<div className="h-person-location-row">
						{member.memberAddress?.trim() && (
							<div className="h-person-address" title={member.memberAddress.trim()}>
								<LocationOnOutlinedIcon aria-hidden="true" />
								<span>{member.memberAddress.trim()}</span>
							</div>
						)}
						<span className="h-person-role">{role}</span>
					</div>
					{member.memberDesc ? (
						<p className="h-person-bio">{member.memberDesc}</p>
					) : (
						<p className="h-person-bio h-person-bio--empty">
							{role === 'Hotel owner' ? 'The person behind your next stay.' : 'A little farther. A little closer.'}
						</p>
					)}
				</div>
				<div className="h-profile-stats h-person-stats">
					<div aria-label={`${count(member.memberViews)} views`}>
						<strong>{count(member.memberViews)}</strong>
						<span>Views</span>
					</div>
					<button type="button" onClick={() => setNetwork('followings')} aria-label={`View following for ${name}`}>
						<strong>{count(member.memberFollowings)}</strong>
						<span>Following</span>
					</button>
					<button type="button" onClick={() => setNetwork('followers')} aria-label={`View followers for ${name}`}>
						<strong>{count(member.memberFollowers)}</strong>
						<span>Followers</span>
					</button>
				</div>
				<div className="h-person-foot">
					<span>
						{member.memberType === 'HOTEL_OWNER'
							? `${count(member.memberHotels)} hosted ${member.memberHotels === 1 ? 'stay' : 'stays'}`
							: 'Part of the Hotelia community'}
					</span>
					<MemberLikeButton memberId={member._id} name={name} likes={member.memberLikes} records={member.meLiked} />
					{!own ? (
						<Link href={href} aria-label={`Open ${name}'s profile`}>
							↗
						</Link>
					) : (
						<span aria-hidden="true" />
					)}
				</div>
			</article>
			{network && (
				<ConnectionsDialog memberId={member._id} name={name} kind={network} onClose={() => setNetwork(null)} />
			)}
		</>
	);
}
