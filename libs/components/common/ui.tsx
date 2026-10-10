import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import {
	Button as MuiButton,
	ButtonProps,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	Pagination as MuiPagination,
	Skeleton,
	TextField,
	TextFieldProps,
} from '@mui/material';
import Link from 'next/link';
import React, { ReactNode, useId, useState } from 'react';
import { getAssetUrl } from '../../config';

export function Button(props: ButtonProps) {
	return <MuiButton variant="contained" {...props} className={`h-button ${props.className || ''}`} />;
}

export function Field(props: TextFieldProps) {
	const id = useId();
	return (
		<TextField fullWidth size="small" {...props} id={props.id || id} className={`h-field ${props.className || ''}`} />
	);
}

export function Chip({
	children,
	tone = 'neutral',
}: {
	children: ReactNode;
	tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
	return <span className={`h-chip h-chip--${tone}`}>{children}</span>;
}

export function SectionHeading({
	eyebrow,
	title,
	children,
	href,
	action = 'Explore',
}: {
	eyebrow?: string;
	title: string;
	children?: ReactNode;
	href?: string;
	action?: string;
}) {
	return (
		<div className="h-section-heading">
			<div>
				{eyebrow && <span className="h-eyebrow">{eyebrow}</span>}
				<h2>{title}</h2>
				{children && <p>{children}</p>}
			</div>
			{href && (
				<Link className="h-text-link" href={href}>
					{action} <ArrowForwardIcon fontSize="small" />
				</Link>
			)}
		</div>
	);
}

export function EmptyState({
	title,
	description,
	action,
	error = false,
}: {
	title: string;
	description?: string;
	action?: ReactNode;
	error?: boolean;
}) {
	return (
		<div className="h-empty" role={error ? 'alert' : 'status'}>
			<span aria-hidden="true" className="h-empty-symbol">
				{error ? '!' : '↗'}
			</span>
			<h3>{title}</h3>
			{description && <p>{description}</p>}
			{action}
		</div>
	);
}

export function CardSkeletons({ count = 3 }: { count?: number }) {
	return (
		<div className="h-card-grid" aria-label="Loading stays" aria-busy="true">
			{Array.from({ length: count }, (_, index) => (
				<div className="h-card" key={index}>
					<Skeleton variant="rectangular" className="h-card-skeleton-image" />
					<div className="h-card-body">
						<Skeleton width="80%" height={34} />
						<Skeleton width="45%" />
						<Skeleton width="65%" />
					</div>
				</div>
			))}
		</div>
	);
}

export function Modal({
	title,
	children,
	open,
	onClose,
}: {
	title: string;
	children: ReactNode;
	open: boolean;
	onClose: () => void;
}) {
	const id = useId();
	return (
		<Dialog open={open} onClose={onClose} aria-labelledby={id} className="h-modal">
			<DialogTitle id={id}>
				{title}
				<IconButton aria-label="Close dialog" onClick={onClose} sx={{ float: 'right' }}>
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent>{children}</DialogContent>
		</Dialog>
	);
}

export function Pagination({
	page,
	total,
	limit,
	onChange,
}: {
	page: number;
	total: number;
	limit: number;
	onChange: (page: number) => void;
}) {
	const count = Math.ceil(total / limit);
	return count > 1 ? (
		<MuiPagination
			className="h-pagination"
			count={count}
			page={page}
			onChange={(_, value) => onChange(value)}
			color="primary"
		/>
	) : null;
}

export function SiteImage({
	src,
	alt,
	className = '',
	eager = false,
}: {
	src?: string | null;
	alt: string;
	className?: string;
	eager?: boolean;
}) {
	const [failedSource, setFailedSource] = useState<string | undefined>();
	const url = getAssetUrl(src, '/img/hotelia/stay-placeholder.svg');
	return (
		<img
			src={failedSource === url ? '/img/hotelia/stay-placeholder.svg' : url}
			alt={alt}
			className={className}
			loading={eager ? 'eager' : 'lazy'}
			decoding="async"
			onError={() => setFailedSource(url)}
		/>
	);
}

export const formatUsd = (value: number) =>
	new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: value % 1 ? 2 : 0,
	}).format(value);
