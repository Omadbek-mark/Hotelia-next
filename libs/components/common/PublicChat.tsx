import { Tabs, Tab } from '@mui/material';
import HoteliaAssistant from './HoteliaAssistant';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import React, { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { REACT_APP_API_URL } from '../../config';
import { useHoteliaTranslation } from '../../hooks/useHoteliaTranslation';

interface ChatMessage {
	id: string;
	clientId: string;
	text: string;
	createdAt: string;
}
const isMessage = (value: any): value is ChatMessage =>
	value &&
	typeof value.id === 'string' &&
	typeof value.clientId === 'string' &&
	typeof value.text === 'string' &&
	value.text.trim().length > 0 &&
	value.text.length <= 1000 &&
	typeof value.createdAt === 'string' &&
	Number.isFinite(Date.parse(value.createdAt));

export default function PublicChat() {
	const iconGradient = useId();
	const tr = useHoteliaTranslation();
	const { locale } = useRouter();
	const user = useReactiveVar(userVar);
	const identity = user._id || 'guest';
	const identities = useRef(new Map<string, Set<string>>());
	const isMine = (message: ChatMessage) => identities.current.get(identity)?.has(message.clientId) || false;
	const outside = useRef<HTMLElement>(null);
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState('community');
	const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [online, setOnline] = useState(0);
	const [, setClientId] = useState('');
	const [input, setInput] = useState('');
	const [error, setError] = useState('');
	const [waiting, setWaiting] = useState(false);
	const [unread, setUnread] = useState(0);
	const visible = useRef(false);
	const toggle = useRef<HTMLButtonElement>(null);
	const panel = useRef<HTMLElement>(null);
	const socket = useRef<WebSocket | null>(null);
	const pending = useRef('');
	const received = useRef(new Set<string>());
	const cooldown = useRef<ReturnType<typeof setTimeout> | null>(null);
	const confirmation = useRef<ReturnType<typeof setTimeout> | null>(null);
	const content = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const positionLauncher = () => {
			const footer = document.querySelector('.h-footer');
			const gap = footer ? Math.max(0, window.innerHeight - footer.getBoundingClientRect().top + 72) : 0;
			outside.current?.style.setProperty(
				'--chat-footer-gap',
				`${Math.min(gap, Math.max(0, window.innerHeight - 80))}px`,
			);
		};
		positionLauncher();
		window.addEventListener('scroll', positionLauncher, { passive: true });
		window.addEventListener('resize', positionLauncher);
		return () => {
			window.removeEventListener('scroll', positionLauncher);
			window.removeEventListener('resize', positionLauncher);
		};
	}, []);

	useEffect(() => {
		const storageKey = `hotelia:chat:identity:${identity}`;
		if (!identities.current.has(identity)) {
			try {
				const saved = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
				identities.current.set(
					identity,
					new Set(Array.isArray(saved) ? saved.filter((id) => typeof id === 'string').slice(-64) : []),
				);
			} catch {
				identities.current.set(identity, new Set());
			}
		}
		setClientId('');
		setInput('');
		setWaiting(false);
		pending.current = '';
		let disposed = false;
		let reconnect: ReturnType<typeof setTimeout> | undefined;
		const connect = () => {
			if (disposed) return;
			setStatus('connecting');
			let ws: WebSocket;
			let connectionId = '';
			try {
				const url = new URL(process.env.NEXT_PUBLIC_API_WS || process.env.REACT_APP_API_WS || REACT_APP_API_URL);
				url.protocol = url.protocol === 'https:' || url.protocol === 'wss:' ? 'wss:' : 'ws:';
				ws = new WebSocket(url.toString());
			} catch {
				setStatus('disconnected');
				setError('Chat is unavailable.');
				return;
			}
			socket.current = ws;
			ws.onopen = () => {
				if (!disposed) {
					setStatus('connected');
					setError('');
				}
			};
			ws.onmessage = (event) => {
				if (disposed) return;
				let packet: any;
				try {
					packet = JSON.parse(event.data);
				} catch {
					return;
				}
				if (!packet || typeof packet !== 'object') return;
				if (packet.event === 'info' && Number.isInteger(packet.totalClients) && packet.totalClients >= 0)
					setOnline(packet.totalClients);
				if (packet.event === 'getMessages' && typeof packet.clientId === 'string' && Array.isArray(packet.list)) {
					connectionId = packet.clientId;
					const owned = identities.current.get(identity) || new Set<string>();
					owned.add(packet.clientId);
					if (owned.size > 64) {
						const oldest = owned.values().next();
						if (!oldest.done) owned.delete(oldest.value);
					}
					identities.current.set(identity, owned);
					try {
						sessionStorage.setItem(storageKey, JSON.stringify(Array.from(owned)));
					} catch {
						/* In-memory identity works without storage. */
					}
					setClientId(packet.clientId);
					const history: ChatMessage[] = packet.list.filter(isMessage).slice(-200);
					received.current = new Set(history.map((message) => message.id));
					setMessages(
						history.filter((message, index) => history.findIndex((item) => item.id === message.id) === index),
					);
				}
				if (packet.event === 'message' && isMessage(packet)) {
					if (received.current.has(packet.id)) return;
					received.current.add(packet.id);
					if (received.current.size > 200) {
						const oldest = received.current.values().next();
						if (!oldest.done) received.current.delete(oldest.value);
					}
					setMessages((list) => [...list, packet].slice(-200));
					if (!visible.current && packet.clientId !== connectionId) setUnread((count) => Math.min(count + 1, 99));
					// The server's echo is the confirmation; there is no local duplicate bubble.
					if (pending.current && packet.clientId === connectionId && socket.current === ws) {
						pending.current = '';
						if (confirmation.current) clearTimeout(confirmation.current);
					}
				}
				if (packet.event === 'error') {
					if (confirmation.current) clearTimeout(confirmation.current);
					setError(
						packet.code === 'RATE_LIMITED'
							? 'Please wait two seconds between messages.'
							: 'Your message could not be sent.',
					);
					if (pending.current) {
						const unsent = pending.current;
						setInput((current) => current || unsent);
						pending.current = '';
					}
				}
			};
			ws.onerror = () => {
				if (!disposed) setError('Chat connection interrupted. Reconnecting...');
			};
			ws.onclose = () => {
				if (disposed) return;
				socket.current = null;
				setStatus('disconnected');
				setOnline(0);
				if (confirmation.current) clearTimeout(confirmation.current);
				if (pending.current) {
					const unsent = pending.current;
					setInput((current) => current || unsent);
					pending.current = '';
				}
				reconnect = setTimeout(connect, 2000);
			};
		};
		connect();
		return () => {
			disposed = true;
			if (reconnect) clearTimeout(reconnect);
			if (cooldown.current) clearTimeout(cooldown.current);
			if (confirmation.current) clearTimeout(confirmation.current);
			const ws = socket.current;
			socket.current = null;
			if (ws) {
				ws.onopen = null;
				ws.onmessage = null;
				ws.onerror = null;
				ws.onclose = null;
				ws.close();
			}
		};
	}, [identity]);
	useEffect(() => {
		if (!open) return;
		const closeOutside = (event: PointerEvent) => {
			if (event.target instanceof Node && !outside.current?.contains(event.target)) setOpen(false);
		};
		document.addEventListener('pointerdown', closeOutside);
		return () => document.removeEventListener('pointerdown', closeOutside);
	}, [open]);
	useEffect(() => {
		if (!open) return;
		const viewport = window.visualViewport;
		const fitVisibleScreen = () => {
			const element = outside.current;
			if (!element) return;
			const height = viewport?.height ?? window.innerHeight;
			element.style.setProperty('--chat-viewport-height', `${height}px`);
			element.style.setProperty('--chat-viewport-width', `${viewport?.width ?? window.innerWidth}px`);
			element.style.setProperty('--chat-viewport-top', `${viewport?.offsetTop ?? 0}px`);
			element.style.setProperty('--chat-viewport-left', `${viewport?.offsetLeft ?? 0}px`);
			element.dataset.compact = String(height < 450);
		};
		fitVisibleScreen();
		viewport?.addEventListener('resize', fitVisibleScreen);
		viewport?.addEventListener('scroll', fitVisibleScreen);
		window.addEventListener('resize', fitVisibleScreen);
		return () => {
			viewport?.removeEventListener('resize', fitVisibleScreen);
			viewport?.removeEventListener('scroll', fitVisibleScreen);
			window.removeEventListener('resize', fitVisibleScreen);
		};
	}, [open]);
	useEffect(() => {
		visible.current = open;
		if (open) {
			setUnread(0);
			// Opening a mobile chat must not summon the keyboard or change page zoom.
			const touchScreen = window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth <= 600;
			if (!touchScreen) {
				panel.current
					?.querySelector<HTMLInputElement>('[role="tabpanel"]:not([hidden]) input:not(:disabled)')
					?.focus({ preventScroll: true });
			}
		}
	}, [open, mode]);

	useEffect(() => {
		if (open && content.current) content.current.scrollTop = content.current.scrollHeight;
	}, [open, messages]);
	const send = (event: FormEvent) => {
		event.preventDefault();
		const text = input.trim();
		const ws = socket.current;
		if (!text || text.length > 1000 || waiting || pending.current || !ws || ws.readyState !== WebSocket.OPEN) return;
		try {
			pending.current = text;
			ws.send(JSON.stringify({ event: 'message', data: text }));
			confirmation.current = setTimeout(() => {
				if (pending.current) {
					const unsent = pending.current;
					setInput((current) => current || unsent);
					pending.current = '';
					setError('Your message was not confirmed. Please try again.');
				}
			}, 10000);
			setInput('');
			setError('');
			setWaiting(true);
			cooldown.current = setTimeout(() => setWaiting(false), 2000);
		} catch {
			pending.current = '';
			setError('Your message could not be sent.');
		}
	};
	return (
		<aside
			ref={outside}
			className={`h-chat${open ? ' h-chat--open' : ''}`}
			onKeyDown={(event) => {
				if (event.key === 'Escape' && open) {
					setOpen(false);
					toggle.current?.focus();
				}
			}}
		>
			{
				<section id="hotelia-chat" ref={panel} hidden={!open} className="h-chat-panel" aria-label={tr('Hotelia chat')}>
					<header>
						<div>
							<span className="h-chat-brand">
								Hotelia <span>Open Horizons</span>
							</span>
							<strong>{tr(mode === 'community' ? 'Traveler lounge' : 'Hotelia assistant')}</strong>
							<small className={`h-chat-status h-chat-status--${status}`}>
								{mode === 'assistant'
									? tr('Your stay companion')
									: status === 'connected'
									? `${online} ${tr('online connections')}`
									: tr(status === 'connecting' ? 'Connecting...' : 'Reconnecting...')}
							</small>
						</div>
						<button type="button" onClick={() => setOpen(false)} aria-label={tr('Close chat')}>
							<CloseIcon />
						</button>
					</header>
					<Tabs
						className="h-chat-tabs"
						value={mode}
						onChange={(_, value) => setMode(value)}
						variant="fullWidth"
						aria-label={tr('Choose chat mode')}
					>
						<Tab
							id="community-chat-tab"
							aria-controls="community-chat-panel"
							value="community"
							label={tr('Community chat')}
						/>
						<Tab
							id="assistant-chat-tab"
							aria-controls="assistant-chat-panel"
							value="assistant"
							label={tr('Hotelia assistant')}
						/>
					</Tabs>
					<div
						id="community-chat-panel"
						role="tabpanel"
						aria-labelledby="community-chat-tab"
						hidden={mode !== 'community'}
					>
						<p className="h-chat-intro">{tr('Chat with other visitors. No login required. Messages are public.')}</p>
						<div
							className="h-chat-messages"
							ref={content}
							role="log"
							aria-live="polite"
							aria-label={tr('Chat messages')}
						>
							{!messages.length && (
								<div className="h-chat-welcome">
									<PeopleOutlineIcon />
									<strong>{tr('Good stays. Great conversations.')}</strong>
									<p className="h-chat-empty">{tr('Start a conversation with other travelers.')}</p>
								</div>
							)}
							{messages.map((message) => (
								<article
									key={message.id}
									className={isMine(message) ? 'h-chat-message h-chat-message--mine' : 'h-chat-message'}
								>
									<small>{isMine(message) ? tr('You') : `${tr('Guest')} ${message.clientId.slice(0, 4)}`}</small>
									<p>{message.text}</p>
									<time dateTime={message.createdAt}>
										{new Date(message.createdAt).toLocaleTimeString(locale || 'en', {
											hour: '2-digit',
											minute: '2-digit',
										})}
									</time>
								</article>
							))}
						</div>
						{error && (
							<p className="h-chat-error" role="alert">
								{tr(error)}
							</p>
						)}
						<form onSubmit={send}>
							<input
								aria-label={tr('Type a message')}
								placeholder={tr('Type a message')}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								maxLength={1000}
								disabled={status !== 'connected'}
							/>
							<button
								type="submit"
								aria-label={tr('Send message')}
								disabled={status !== 'connected' || waiting || !input.trim()}
							>
								<SendIcon fontSize="small" />
							</button>
						</form>
					</div>
					<div
						id="assistant-chat-panel"
						role="tabpanel"
						aria-labelledby="assistant-chat-tab"
						hidden={mode !== 'assistant'}
					>
						<HoteliaAssistant />
					</div>
				</section>
			}
			<button
				className="h-chat-toggle"
				ref={toggle}
				type="button"
				onClick={() => setOpen((value) => !value)}
				aria-label={tr(open ? 'Close chat' : 'Open Hotelia chat')}
				aria-expanded={open}
				aria-controls="hotelia-chat"
			>
				{open ? (
					<CloseIcon />
				) : (
					<svg className="h-chat-launcher-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
						<defs>
							<linearGradient id={iconGradient} x1="8" y1="48" x2="56" y2="12" gradientUnits="userSpaceOnUse">
								<stop stopColor="#a33e26" />
								<stop offset="1" stopColor="#285e43" />
							</linearGradient>
						</defs>
						<path
							d="M43 13H15a8 8 0 0 0-8 8v20a8 8 0 0 0 8 8h12l7 10 7-10h8a8 8 0 0 0 8-8v-8"
							stroke={`url(#${iconGradient})`}
							strokeWidth="3"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<g fill={`url(#${iconGradient})`}>
							<circle cx="20" cy="31" r="3.2" />
							<circle cx="32" cy="31" r="3.2" />
							<circle cx="44" cy="31" r="3.2" />
						</g>
						<path d="M53 5c1.5 8 3 9.5 11 11-8 1.5-9.5 3-11 11-1.5-8-3-9.5-11-11 8-1.5 9.5-3 11-11Z" fill="#285e43" />
					</svg>
				)}
				{unread > 0 && !open && (
					<b className="h-chat-unread" aria-label={`${unread} ${tr('unread messages')}`}>
						{unread}
					</b>
				)}
			</button>
		</aside>
	);
}
