import { gql, useMutation } from '@apollo/client';
import SendIcon from '@mui/icons-material/Send';
import Link from 'next/link';
import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { useHoteliaTranslation } from '../../hooks/useHoteliaTranslation';
const ASK = gql`
	mutation AskHoteliaAssistant($input: ChatbotInput!) {
		askHoteliaAssistant(input: $input) {
			answer
			sources {
				title
				url
			}
		}
	}
`;
interface Turn {
	role: 'user' | 'model';
	text: string;
	sources?: { title: string; url: string }[];
}
export default function HoteliaAssistant() {
	const tr = useHoteliaTranslation();
	const [ask] = useMutation(ASK);
	const [turns, setTurns] = useState<Turn[]>([]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const pending = useRef(false);
	const mounted = useRef(true);
	const content = useRef<HTMLDivElement>(null);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);
	useEffect(() => {
		if (content.current) content.current.scrollTop = content.current.scrollHeight;
	}, [turns, loading]);
	const send = async (event: FormEvent) => {
		event.preventDefault();
		const message = input.trim();
		if (!message || message.length > 1000 || pending.current) return;
		pending.current = true;
		setLoading(true);
		setError('');
		setInput('');
		setTurns((list) => [...list, { role: 'user', text: message }]);
		try {
			const { data } = await ask({
				variables: { input: { message, history: turns.slice(-10).map(({ role, text }) => ({ role, text })) } },
				fetchPolicy: 'no-cache',
				context: { skipAuth: true },
			});
			if (!data?.askHoteliaAssistant?.answer)
				throw new Error('The assistant could not answer. Please rephrase your question.');
			if (mounted.current)
				setTurns(
					(list) =>
						[
							...list,
							{ role: 'model', text: data.askHoteliaAssistant.answer, sources: data.askHoteliaAssistant.sources },
						].slice(-20) as Turn[],
				);
		} catch (failure) {
			if (mounted.current) {
				setError(
					failure instanceof Error ? failure.message : 'The assistant is temporarily unavailable. Please try again.',
				);
				setInput(message);
				setTurns((list) => list.slice(0, -1));
			}
		} finally {
			pending.current = false;
			if (mounted.current) setLoading(false);
		}
	};
	return (
		<>
			<p className="h-chat-intro">
				{tr(
					'Ask about Hotelia, hotels, rooms and travel. Powered by Gemini. Your messages are sent to Google; do not include personal details.',
				)}
			</p>
			<div
				className="h-chat-messages"
				role="log"
				aria-live="polite"
				aria-label={tr('Assistant messages')}
				ref={content}
			>
				{!turns.length && (
					<p className="h-chat-empty">{tr('How can I help? Ask how booking works or search for a hotel.')}</p>
				)}
				{turns.map((turn, index) => (
					<article
						key={index}
						className={turn.role === 'user' ? 'h-chat-message h-chat-message--mine' : 'h-chat-message'}
					>
						<small>{tr(turn.role === 'user' ? 'You' : 'Hotelia assistant')}</small>
						<p>{turn.text}</p>
						{turn.sources
							?.filter((source) => /^\/hotel\/detail\?hotelId=[a-fA-F0-9]{24}$/.test(source.url))
							.map((source) => (
								<Link className="h-chat-source" key={source.url} href={source.url}>
									{source.title}
								</Link>
							))}
					</article>
				))}
				{loading && (
					<p className="h-chat-empty" role="status">
						{tr('Thinking...')}
					</p>
				)}
			</div>
			{error && (
				<p className="h-chat-error" role="alert">
					{tr(error)}
				</p>
			)}
			<form onSubmit={send}>
				<input
					aria-label={tr('Ask the assistant')}
					placeholder={tr('Ask the assistant')}
					value={input}
					onChange={(event) => setInput(event.target.value)}
					maxLength={1000}
					disabled={loading}
				/>
				<button type="submit" aria-label={tr('Send question')} disabled={loading || !input.trim()}>
					<SendIcon fontSize="small" />
				</button>
			</form>
		</>
	);
}
