import { useReactiveVar } from '@apollo/client';
import { useRef } from 'react';
import { userVar } from '../../../apollo/store';
import { uploadImages } from '../../api/upload';
import { label } from '../../owner/model';
import { Button, Field, SiteImage } from '../common/ui';

export function PhotoField({
	value,
	onChange,
	target,
	busy,
	onBusy,
	onError,
}: {
	value: string[];
	onChange: (v: string[]) => void;
	target: 'hotel' | 'room';
	busy: boolean;
	onBusy: (v: boolean) => void;
	onError: (v: string) => void;
}) {
	const lock = useRef(false),
		owner = useReactiveVar(userVar);
	return (
		<div className="h-owner-photos">
			<div className="h-owner-section-heading">
				<h2>Photography</h2>
				<span>{value.length} / 20</span>
			</div>
			<div className="h-owner-photo-grid">
				{value.map((src, index) => (
					<div key={src}>
						<SiteImage src={src} alt={`${target} photo ${index + 1}`} />
						<small>{index === 0 ? 'Cover photo' : `Photo ${index + 1}`}</small>
						<div>
							<Button
								variant="text"
								size="small"
								disabled={busy}
								onClick={() => onChange(value.filter((_, i) => i !== index))}
								aria-label={`Remove photo ${index + 1}`}
							>
								Remove
							</Button>
							{index > 0 && (
								<Button
									variant="text"
									size="small"
									disabled={busy}
									onClick={() => onChange([src, ...value.filter((_, i) => i !== index)])}
									aria-label={`Make photo ${index + 1} cover`}
								>
									Make cover
								</Button>
							)}
						</div>
					</div>
				))}
			</div>
			<Button component="label" variant="outlined" disabled={busy || value.length === 20}>
				{busy ? 'Uploading…' : 'Add photos +'}
				<input
					type="file"
					hidden
					multiple
					accept="image/jpeg,image/png"
					onChange={async (e) => {
						const files = Array.from(e.target.files || []);
						e.target.value = '';
						if (!files.length || lock.current) return;
						if (files.length > 10 || value.length + files.length > 20) {
							onError('Choose up to 10 photos at once, with no more than 20 in total.');
							return;
						}
						const ownerId = owner._id;
						lock.current = true;
						onBusy(true);
						onError('');
						try {
							const paths = await uploadImages(files, target);
							if (userVar()._id === ownerId) onChange(Array.from(new Set([...value, ...paths])));
						} catch (e) {
							onError((e as Error).message);
						} finally {
							lock.current = false;
							onBusy(false);
						}
					}}
				/>
			</Button>
			<small>JPG or PNG · up to 15 MB each · 1–20 photos</small>
		</div>
	);
}

export function Amenities({
	value,
	onChange,
	options,
	disabled,
}: {
	value: string[];
	onChange: (v: any[]) => void;
	options: string[];
	disabled: boolean;
}) {
	return (
		<fieldset className="h-owner-amenity-options">
			<legend>Amenities</legend>
			{options.map((option) => (
				<label key={option}>
					<input
						type="checkbox"
						disabled={disabled}
						checked={value.includes(option)}
						onChange={(e) => onChange(e.target.checked ? [...value, option] : value.filter((v) => v !== option))}
					/>
					{label(option)}
				</label>
			))}
		</fieldset>
	);
}

export function SelectField({
	title,
	value,
	onChange,
	options,
	disabled,
}: {
	title: string;
	value: string;
	onChange: (v: any) => void;
	options: string[];
	disabled: boolean;
}) {
	return (
		<Field
			label={title}
			select
			value={value}
			disabled={disabled}
			SelectProps={{ native: true }}
			onChange={(e) => onChange(e.target.value)}
		>
			{options.map((v) => (
				<option key={v} value={v}>
					{label(v)}
				</option>
			))}
		</Field>
	);
}
