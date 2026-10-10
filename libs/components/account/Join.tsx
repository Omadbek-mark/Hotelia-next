import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Alert, IconButton, InputAdornment } from '@mui/material';
import { useRouter } from 'next/router';
import React, { FormEvent, useState } from 'react';
import { logIn, signUp } from '../../auth/index';
import assets from '../../config/design-assets.json';
import { MemberType } from '../../enums';
import { Button, Field, SiteImage } from '../common/ui';
import PublicLayout from '../layout/PublicLayout';

export default function Join() {
	const router = useRouter();
	const [mode, setMode] = useState<'login' | 'signup'>('login');
	const [showPassword, setShowPassword] = useState(false);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState('');
	const [input, setInput] = useState({ nick: '', password: '', email: '', phone: '', type: MemberType.USER });
	const signup = mode === 'signup';
	const change = (key: keyof typeof input, value: string) => setInput((previous) => ({ ...previous, [key]: value }));
	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (pending) return;
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
			setPending(false);
		}
	};
	return (
		<PublicLayout title={signup ? 'Join' : 'Sign in'}>
			<section className="h-auth h-container">
				<div className="h-auth-form">
					<span className="h-eyebrow">Your next chapter</span>
					<h1>{signup ? 'Make yourself at home.' : 'Welcome back.'}</h1>
					<p>{signup ? 'One account. More places to discover.' : 'Your stays, saved and ready.'}</p>
					<div className="h-auth-tabs" aria-label="Account options">
						<button
							type="button"
							aria-pressed={!signup}
							disabled={pending}
							onClick={() => {
								setMode('login');
								setError('');
							}}
						>
							Sign in
						</button>
						<button
							type="button"
							aria-pressed={signup}
							disabled={pending}
							onClick={() => {
								setMode('signup');
								setError('');
							}}
						>
							Join Hotelia
						</button>
					</div>
					<form onSubmit={submit} aria-busy={pending}>
						<Field
							label="Nickname"
							value={input.nick}
							onChange={(event) => change('nick', event.target.value)}
							required
							autoComplete="username"
							inputProps={{ minLength: 3, maxLength: 12 }}
							disabled={pending}
						/>
						{signup && (
							<Field
								label="Email"
								type="email"
								value={input.email}
								onChange={(event) => change('email', event.target.value)}
								required
								autoComplete="email"
								disabled={pending}
							/>
						)}
						<Field
							label="Password"
							type={showPassword ? 'text' : 'password'}
							value={input.password}
							onChange={(event) => change('password', event.target.value)}
							required
							autoComplete={signup ? 'new-password' : 'current-password'}
							inputProps={{ minLength: 5, maxLength: 12 }}
							disabled={pending}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											aria-label={showPassword ? 'Hide password' : 'Show password'}
											onClick={() => setShowPassword(!showPassword)}
											edge="end"
										>
											{showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
										</IconButton>
									</InputAdornment>
								),
							}}
						/>
						{signup && (
							<>
								<Field
									label="Phone (optional)"
									type="tel"
									value={input.phone}
									autoComplete="tel"
									disabled={pending}
									onChange={(event) => change('phone', event.target.value)}
								/>
								<fieldset className="h-role-options" disabled={pending}>
									<legend>I’m here to</legend>
									<label>
										<input
											type="radio"
											name="account-type"
											value={MemberType.USER}
											checked={input.type === MemberType.USER}
											onChange={() => change('type', MemberType.USER)}
										/>
										Explore stays
									</label>
									<label>
										<input
											type="radio"
											name="account-type"
											value={MemberType.HOTEL_OWNER}
											checked={input.type === MemberType.HOTEL_OWNER}
											onChange={() => change('type', MemberType.HOTEL_OWNER)}
										/>
										Host guests
									</label>
								</fieldset>
							</>
						)}
						{error && (
							<Alert severity="error" className="h-form-feedback">
								{error}
							</Alert>
						)}
						<Button color="secondary" type="submit" fullWidth disabled={pending} endIcon={<ArrowForwardIcon />}>
							{pending ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
						</Button>
					</form>
				</div>
				<div className="h-auth-photo">
					<SiteImage src={assets.account} alt="A quiet architectural retreat" eager />
					<div>
						<span className="h-eyebrow">Open Horizons</span>
						<h2>
							Some places
							<br />
							stay with you.
						</h2>
					</div>
				</div>
			</section>
		</PublicLayout>
	);
}
