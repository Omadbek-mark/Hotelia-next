import { ProfileHotels, ProfileJournal } from '../member/ProfileContent';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { GET_PUBLIC_PROFILE, PublicProfile } from '../../../apollo/user/social';
import ProfileCard from '../common/ProfileCard';
import ProfilePaymentCard from '../payment/ProfilePaymentCard';
import { UPDATE_MEMBER } from '../../../apollo/user/auth';
import { uploadImage } from '../../api/upload';
import { applySessionMember } from '../../auth/index';
import { profileError, profileUpdate } from '../../member/profile-update';
import type { Member, MemberUpdate } from '../../types/contracts';
import { Button, Chip, Field, SiteImage } from '../common/ui';

export default function MyProfile(_props: any) {
	const user = useReactiveVar(userVar);
	const [editing, setEditing] = useState(false);
	const savingRef = useRef(false);
	const { data } = useQuery<{ getMember: PublicProfile }>(GET_PUBLIC_PROFILE, {
		variables: { memberId: user._id },
		skip: !user._id,
		fetchPolicy: 'cache-and-network',
	});
	const [save, { loading }] = useMutation<{ updateMember: Member }, { input: MemberUpdate }>(UPDATE_MEMBER);
	const [photoUploading, setPhotoUploading] = useState(false);
	const [feedback, setFeedback] = useState({ error: false, message: '' });
	const [input, setInput] = useState({
		memberNick: '',
		memberEmail: '',
		memberPhone: '',
		memberFullName: '',
		memberAddress: '',
		memberDesc: '',
		memberImage: '',
	});
	useEffect(() => {
		setInput({
			memberNick: user.memberNick,
			memberEmail: user.memberEmail || '',
			memberPhone: user.memberPhone,
			memberFullName: user.memberFullName || '',
			memberAddress: user.memberAddress || '',
			memberDesc: user.memberDesc || '',
			memberImage: user.memberImage || '',
		});
	}, [user, editing]);
	const change = (key: keyof typeof input, value: string) => setInput((previous) => ({ ...previous, [key]: value }));
	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (savingRef.current || loading || photoUploading) return;
		savingRef.current = true;
		setFeedback({ error: false, message: '' });
		try {
			const { data } = await save({
				variables: { input: profileUpdate(input) },
			});
			if (!data?.updateMember || data.updateMember._id !== user._id) throw new Error('No profile response');
			if (userVar()._id !== user._id) return;
			applySessionMember(data.updateMember);
			setFeedback({ error: false, message: 'Profile updated.' });
			setEditing(false);
		} catch (error) {
			setFeedback({ error: true, message: profileError(error) });
		} finally {
			savingRef.current = false;
		}
	};
	return (
		<section className="h-profile">
			<div className="h-page-heading">
				<span className="h-eyebrow">Your account</span>
				<h1>My profile</h1>
			</div>
			<div className="h-my-profile-overview">
				<ProfileCard
					member={{
						...data?.getMember,
						...user,
						memberViews: data?.getMember.memberViews ?? user.memberViews,
						memberLikes: data?.getMember.memberLikes ?? user.memberLikes,
						memberFollowers: data?.getMember.memberFollowers ?? user.memberFollowers,
						memberFollowings: data?.getMember.memberFollowings ?? user.memberFollowings,
					}}
					onEdit={() => {
						setFeedback({ error: false, message: '' });
						setEditing(true);
					}}
				/>
				<div className="h-my-profile-note">
					<span className="h-eyebrow">Your next chapter</span>
					<h2>
						A place in
						<br />
						the community.
					</h2>
					<p>Your stays, stories and people — all connected through your Hotelia profile.</p>
					<Button variant="outlined" href="/hotel">
						Discover stays ↗
					</Button>
				</div>
			</div>
			{feedback.message && !editing && (
				<Alert severity={feedback.error ? 'error' : 'success'} className="h-form-feedback">
					{feedback.message}
				</Alert>
			)}
			<div className="h-my-profile-content">
				{(user.memberType === 'HOTEL_OWNER' || user.memberType === 'ADMIN') && (
					<ProfileHotels memberId={user._id} own />
				)}
				<ProfileJournal memberId={user._id} own />
			</div>
			<Dialog
				open={editing}
				onClose={loading || photoUploading ? undefined : () => setEditing(false)}
				fullWidth
				maxWidth="md"
				className="h-edit-profile-dialog"
				aria-labelledby="hotelia-edit-profile-title"
			>
				<DialogTitle id="hotelia-edit-profile-title">
					Edit profile
					<IconButton
						disabled={loading || photoUploading}
						onClick={() => setEditing(false)}
						aria-label="Close profile editor"
					>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<form onSubmit={submit} aria-busy={loading || photoUploading}>
						<div className="h-profile-photo">
							<SiteImage src={input.memberImage || '/img/profile/defaultUser.svg'} alt="Your profile" />
							<div>
								<label className="h-upload-label">
									{photoUploading ? 'Uploading…' : 'Change photo'}
									<input
										type="file"
										accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
										disabled={loading || photoUploading}
										onChange={async (event) => {
											const file = event.target.files?.[0];
											if (!file) return;
											event.target.value = '';
											setPhotoUploading(true);
											try {
												change('memberImage', await uploadImage(file, 'member'));
											} catch (error) {
												setFeedback({
													error: true,
													message: error instanceof Error ? error.message : 'Image upload failed.',
												});
											} finally {
												setPhotoUploading(false);
											}
										}}
									/>
								</label>
								<p>JPG, JPEG, PNG or WebP</p>
							</div>
							<Chip>
								{user.memberType === 'HOTEL_OWNER' ? 'Hotel owner' : user.memberType === 'ADMIN' ? 'Admin' : 'Traveler'}
							</Chip>
						</div>
						<div className="h-form-grid">
							<Field
								label="Nickname"
								value={input.memberNick}
								onChange={(event) => change('memberNick', event.target.value)}
								required
								inputProps={{ minLength: 3, maxLength: 12 }}
							/>
							<Field
								label="Full name"
								value={input.memberFullName}
								onChange={(event) => change('memberFullName', event.target.value)}
								inputProps={{ minLength: 3, maxLength: 100 }}
							/>
							<Field
								label="Email"
								type="email"
								autoComplete="email"
								value={input.memberEmail}
								onChange={(event) => change('memberEmail', event.target.value)}
								helperText={!user.memberEmail ? 'Optional · leave blank to keep your current email' : undefined}
							/>
							<Field
								label="Phone"
								type="tel"
								autoComplete="tel"
								value={input.memberPhone}
								helperText="Optional · leave blank to keep your current phone"
								onChange={(event) => change('memberPhone', event.target.value)}
							/>
						</div>
						<Field
							label="Address"
							autoComplete="street-address"
							value={input.memberAddress}
							onChange={(event) => change('memberAddress', event.target.value)}
						/>
						<Field
							label="About you"
							multiline
							rows={3}
							value={input.memberDesc}
							onChange={(event) => change('memberDesc', event.target.value)}
						/>
						<ProfilePaymentCard key={user._id} />
						{feedback.message && (
							<Alert severity={feedback.error ? 'error' : 'success'} className="h-form-feedback">
								{feedback.message}
							</Alert>
						)}
						<Button type="submit" color="secondary" disabled={loading || photoUploading}>
							{loading ? 'Saving…' : 'Save changes'}
						</Button>
					</form>
				</DialogContent>
			</Dialog>
		</section>
	);
}
