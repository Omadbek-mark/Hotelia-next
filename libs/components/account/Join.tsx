import Link from 'next/link';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import WbTwilightOutlinedIcon from '@mui/icons-material/WbTwilightOutlined';
import { useHoteliaTranslation } from '../../hooks/useHoteliaTranslation';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Alert, IconButton } from '@mui/material';
import { useRouter } from 'next/router';
import React, { FormEvent, useRef, useState } from 'react';
import { logIn, signUp } from '../../auth/index';
import assets from '../../config/design-assets.json';
import { MemberType } from '../../enums';
import { Button, SiteImage } from '../common/ui';
import PublicLayout from '../layout/PublicLayout';

export default function Join() {
	const router = useRouter();
	const tr = useHoteliaTranslation();
	const submitting = useRef(false);
	const [mode, setMode] = useState<'login' | 'signup'>('login');
	const [showPassword, setShowPassword] = useState(false);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState('');
	const [input, setInput] = useState({ nick: '', password: '', email: '', phone: '', type: MemberType.USER });
	const signup = mode === 'signup';
	const change = (key: keyof typeof input, value: string) => setInput((previous) => ({ ...previous, [key]: value }));
	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (submitting.current) return;
		submitting.current = true;
		setPending(true);
		setError('');
		try {
			if (signup)
				await signUp({
					memberNick: input.nick.trim(),
					memberPassword: input.password,
					memberEmail: input.email.trim(),
					memberType: input.type,
					...(input.phone.trim() ? { memberPhone: input.phone.trim() } : {}),
				});
			else await logIn(input.nick.trim(), input.password);
			const referrer = router.query.referrer;
			await router.push(
				typeof referrer === 'string' &&
					referrer.startsWith('/') &&
					!referrer.startsWith('//') &&
					!referrer.includes('\\')
					? referrer
					: '/',
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : '';
			setError(
				/match|password|not authenticated/i.test(message)
					? 'Check your nickname and password.'
					: /exist|duplicate/i.test(message)
					? 'That nickname or email is already registered.'
					: 'Unable to continue. Check your details and try again.',
			);
		} finally {
			submitting.current = false;
			setPending(false);
		}
	};
	const switchMode = (next: 'login' | 'signup') => {
		if (pending) return;
		setMode(next);
		setError('');
		setShowPassword(false);
	};
	const fields = [
		{
			key: 'nick' as const,
			label: 'Nickname',
			hint: '3–12 characters',
			placeholder: 'Your nickname',
			type: 'text',
			autocomplete: 'username',
			required: true,
			minLength: 3,
			maxLength: 12,
			icon: <BadgeOutlinedIcon />,
		},
		...(signup
			? [
					{
						key: 'email' as const,
						label: 'Email address',
						hint: 'Booking updates',
						placeholder: 'you@example.com',
						type: 'email',
						autocomplete: 'email',
						required: true,
						icon: <AlternateEmailIcon />,
					},
			  ]
			: []),
		{
			key: 'password' as const,
			label: 'Password',
			hint: '5–12 characters',
			placeholder: 'Enter your password',
			type: showPassword ? 'text' : 'password',
			autocomplete: signup ? 'new-password' : 'current-password',
			required: true,
			minLength: 5,
			maxLength: 12,
			icon: null,
		},
		...(signup
			? [
					{
						key: 'phone' as const,
						label: 'Phone number',
						hint: 'Optional',
						placeholder: '+82 10-2345-6789',
						type: 'tel',
						autocomplete: 'tel',
						required: false,
						icon: <PhoneOutlinedIcon />,
					},
			  ]
			: []),
	];
	return (
		<PublicLayout title={tr(signup ? 'Join Hotelia' : 'Log in')}>
			<section className={`h-auth h-container${signup ? ' h-auth--signup' : ''}`}>
				<div className="h-auth-form">
					<Link href="/" className="h-auth-brand" aria-label="Hotelia home">
						<span>Hotelia</span>
						<small>Open Horizons</small>
					</Link>
					<h1 className="h-auth-heading">{tr(signup ? 'Join Hotelia' : 'Log in to Hotelia')}</h1>
					<p>{tr('Discover boutique hotels and peaceful stays across East and Central Asia.')}</p>
					<div className="h-auth-tabs" aria-label={tr('Account options')}>
						<button type="button" aria-pressed={!signup} disabled={pending} onClick={() => switchMode('login')}>
							{tr('Log in')}
						</button>
						<button type="button" aria-pressed={signup} disabled={pending} onClick={() => switchMode('signup')}>
							{tr('Join Hotelia')}
						</button>
					</div>
					<form onSubmit={submit} aria-label={tr(signup ? 'Create account' : 'Log in to Hotelia')} aria-busy={pending}>
						{signup && (
							<fieldset className="h-role-options" disabled={pending}>
								<legend>{tr('Account type')}</legend>
								{[
									{ value: MemberType.USER, label: 'Guest', description: 'Discover hotels and book your next stay.' },
									{
										value: MemberType.HOTEL_OWNER,
										label: 'Hotel owner',
										description: 'List hotels and manage room reservations.',
									},
								].map((role) => (
									<label key={role.value} className={input.type === role.value ? 'is-selected' : undefined}>
										<span className="h-auth-role-top">
											<strong>{tr(role.label)}</strong>
											<input
												type="radio"
												name="account-type"
												value={role.value}
												checked={input.type === role.value}
												onChange={() => change('type', role.value)}
											/>
										</span>
										<span>{tr(role.description)}</span>
									</label>
								))}
							</fieldset>
						)}
						{fields.map((field) => (
							<div className="h-auth-field" key={field.key}>
								<div className="h-auth-field-label">
									<label htmlFor={`hotelia-auth-${field.key}`}>{tr(field.label)}</label>
									<small id={`hotelia-auth-${field.key}-hint`}>{tr(field.hint)}</small>
								</div>
								<div className="h-auth-input">
									<input
										id={`hotelia-auth-${field.key}`}
										name={field.key}
										type={field.type}
										placeholder={tr(field.placeholder)}
										value={input[field.key]}
										onChange={(event) => change(field.key, event.target.value)}
										autoComplete={field.autocomplete}
										required={field.required}
										minLength={field.minLength}
										maxLength={field.maxLength}
										disabled={pending}
										aria-describedby={`hotelia-auth-${field.key}-hint`}
									/>
									{field.key === 'password' ? (
										<IconButton
											type="button"
											aria-label={tr(showPassword ? 'Hide password' : 'Show password')}
											onClick={() => setShowPassword(!showPassword)}
											disabled={pending}
										>
											{showPassword ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
										</IconButton>
									) : (
										<span aria-hidden="true">{field.icon}</span>
									)}
								</div>
							</div>
						))}
						{error && (
							<Alert severity="error" className="h-form-feedback">
								{tr(error)}
							</Alert>
						)}
						<Button
							className="h-auth-submit"
							color={signup ? 'secondary' : 'primary'}
							type="submit"
							fullWidth
							disabled={pending}
							endIcon={<ArrowForwardIcon />}
						>
							{tr(pending ? 'Please wait…' : signup ? 'Create account' : 'Log in to Hotelia')}
						</Button>
					</form>
					<div className="h-auth-switch">
						<span>{tr(signup ? 'Already have an account?' : 'New to Hotelia?')}</span>
						<button type="button" disabled={pending} onClick={() => switchMode(signup ? 'login' : 'signup')}>
							{tr(signup ? 'Log in' : 'Join Hotelia')}
						</button>
					</div>
					<p className="h-auth-note">{tr('Your next chapter starts here.')}</p>
				</div>
				<div className="h-auth-photo">
					<SiteImage src={assets.account} alt="A lantern-lit Korean courtyard at dusk" eager />
					<span className="h-auth-photo-mark" aria-hidden="true" />
					<span className="h-auth-location">
						<WbTwilightOutlinedIcon fontSize="small" />
						Seoul, South Korea
					</span>
					<div className="h-auth-photo-copy">
						<span className="h-eyebrow">{tr('Architectural haven')}</span>
						<h2>{tr('Find your quiet corner of the world.')}</h2>
						<p>{tr('Curated boutique stays across East and Central Asia.')}</p>
						<div className="h-auth-highlights">
							{[
								{ label: 'Thoughtful stays', value: 'Your next escape' },
								{ label: 'Local hosts', value: 'Warm welcomes' },
								{ label: 'Stay discovery', value: 'Made simple' },
							].map((item) => (
								<div key={item.label}>
									<small>{tr(item.label)}</small>
									<span>{tr(item.value)}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>
		</PublicLayout>
	);
}
