import React, { FormEvent, useEffect, useState } from 'react';
import { Alert } from '@mui/material';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { applySessionMember } from '../../auth';
import { UPDATE_MEMBER } from '../../../apollo/hotelia/auth';
import type { Member, MemberUpdate } from '../../types/hotelia/contracts';
import { uploadImage } from '../../api/upload';
import { Button, Chip, Field, SiteImage } from '../hotelia/ui';

export default function MyProfile(_props: any) {
	const user = useReactiveVar(userVar);
	const [save, { loading }] = useMutation<{ updateMember: Member }, { input: MemberUpdate }>(UPDATE_MEMBER);
	const [photoUploading, setPhotoUploading] = useState(false);
	const [feedback, setFeedback] = useState({ error: false, message: '' });
	const [input, setInput] = useState({ memberNick: '', memberEmail: '', memberPhone: '', memberFullName: '', memberAddress: '', memberDesc: '', memberImage: '' });
	useEffect(() => { setInput({ memberNick: user.memberNick, memberEmail: user.memberEmail || '', memberPhone: user.memberPhone,
		memberFullName: user.memberFullName || '', memberAddress: user.memberAddress || '', memberDesc: user.memberDesc || '', memberImage: user.memberImage || '' }); }, [user]);
	const change = (key: keyof typeof input, value: string) => setInput((previous) => ({ ...previous, [key]: value }));
	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault(); if (loading || photoUploading) return; setFeedback({ error: false, message: '' });
		try {
			const { data } = await save({ variables: { input: { ...input, memberFullName: input.memberFullName || undefined } } });
			if (!data) throw new Error('No profile response');
			applySessionMember(data.updateMember); setFeedback({ error: false, message: 'Profile updated.' });
		} catch { setFeedback({ error: true, message: 'Could not save your profile. Check your details and try again.' }); }
	};
	return <section className="h-profile"><div className="h-page-heading"><span className="h-eyebrow">Your account</span><h1>My profile</h1></div>
		<form onSubmit={submit} aria-busy={loading || photoUploading}>
			<div className="h-profile-photo"><SiteImage src={input.memberImage} alt="Your profile" />
				<div><label className="h-upload-label">{photoUploading ? 'Uploading…' : 'Change photo'}<input type="file" accept="image/jpeg,image/png" disabled={loading || photoUploading} onChange={async (event) => {
					const file = event.target.files?.[0]; if (!file) return; event.target.value = ''; setPhotoUploading(true);
					try { change('memberImage', await uploadImage(file, 'member')); } catch { setFeedback({ error: true, message: 'Choose a JPG or PNG image under 15 MB.' }); }
					finally { setPhotoUploading(false); }
				}} /></label><p>JPG or PNG · up to 15 MB</p></div>
				<Chip>{user.memberType === 'HOTEL_OWNER' ? 'Hotel owner' : user.memberType === 'ADMIN' ? 'Admin' : 'Traveler'}</Chip>
			</div><div className="h-form-grid">
				<Field label="Nickname" value={input.memberNick} onChange={(event) => change('memberNick', event.target.value)} required inputProps={{ minLength: 3, maxLength: 12 }} />
				<Field label="Full name" value={input.memberFullName} onChange={(event) => change('memberFullName', event.target.value)} inputProps={{ minLength: 3, maxLength: 100 }} />
				<Field label="Email" type="email" autoComplete="email" value={input.memberEmail} onChange={(event) => change('memberEmail', event.target.value)} required />
				<Field label="Phone" type="tel" autoComplete="tel" value={input.memberPhone} onChange={(event) => change('memberPhone', event.target.value)} />
			</div><Field label="Address" autoComplete="street-address" value={input.memberAddress} onChange={(event) => change('memberAddress', event.target.value)} />
			<Field label="About you" multiline rows={3} value={input.memberDesc} onChange={(event) => change('memberDesc', event.target.value)} />
			{feedback.message && <Alert severity={feedback.error ? 'error' : 'success'} className="h-form-feedback">{feedback.message}</Alert>}
			<Button type="submit" color="secondary" disabled={loading || photoUploading}>{loading ? 'Saving…' : 'Save changes'}</Button>
		</form>
	</section>;
}
