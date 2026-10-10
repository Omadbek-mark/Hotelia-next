import CloseIcon from '@mui/icons-material/Close';
import { Alert, Checkbox, FormControlLabel, IconButton, MenuItem } from '@mui/material';
import { FormEvent, useEffect, useState } from 'react';
import { hotelSearchQuery, parseHotelSearch, searchLabels } from '../../search/hotel-search';
import type { HotelsInquiry } from '../../types/contracts';
import { HotelAmenity, HotelType, RoomType } from '../../enums';
import { Button, Field } from '../common/ui';

const filterKeys = ['text', 'minPrice', 'maxPrice', 'hotelType', 'roomType', 'minRating', 'amenities'] as const;

export default function Filters({
	input,
	apply,
	close,
}: {
	input: HotelsInquiry;
	apply: (input: HotelsInquiry) => Promise<unknown>;
	close?: () => void;
}) {
	const [draft, setDraft] = useState<Record<string, string>>(hotelSearchQuery(input));
	const [error, setError] = useState('');
	const [pending, setPending] = useState(false);
	useEffect(() => {
		setDraft(hotelSearchQuery(input));
		setError('');
	}, [input]);
	const set = (key: string, value: string) => setDraft((previous) => ({ ...previous, [key]: value }));
	const amenities = (draft.amenities || '').split(',').filter(Boolean);
	const submit = async (event: FormEvent) => {
		event.preventDefault();
		const parsed = parseHotelSearch({ ...draft, page: '1' });
		if (parsed.error) {
			setError(parsed.error);
			return;
		}
		setError('');
		setPending(true);
		try {
			await apply(parsed.input);
			close?.();
		} catch {
			setError('Could not apply filters. Try again.');
		} finally {
			setPending(false);
		}
	};
	return (
		<form className="h-catalog-filters" onSubmit={submit}>
			<div className="h-filter-heading">
				<h2>Refine your stay</h2>
				{close && (
					<IconButton aria-label="Close filters" onClick={close}>
						<CloseIcon />
					</IconButton>
				)}
			</div>
			<Field
				label="Hotel name"
				value={draft.text || ''}
				inputProps={{ maxLength: 100 }}
				onChange={(event) => set('text', event.target.value)}
			/>
			<fieldset>
				<legend>
					Nightly budget <small>USD</small>
				</legend>
				<div className="h-price-fields">
					<Field
						label="Minimum"
						type="number"
						value={draft.minPrice || ''}
						inputProps={{ min: 0, step: 0.01 }}
						onChange={(event) => set('minPrice', event.target.value)}
					/>
					<Field
						label="Maximum"
						type="number"
						value={draft.maxPrice || ''}
						inputProps={{ min: 0, step: 0.01 }}
						onChange={(event) => set('maxPrice', event.target.value)}
					/>
				</div>
			</fieldset>
			<Field
				select
				label="Stay type"
				value={draft.hotelType || ''}
				onChange={(event) => set('hotelType', event.target.value)}
			>
				<MenuItem value="">Any stay</MenuItem>
				{Object.values(HotelType).map((value) => (
					<MenuItem key={value} value={value}>
						{searchLabels[value]}
					</MenuItem>
				))}
			</Field>
			<Field
				select
				label="Room type"
				value={draft.roomType || ''}
				onChange={(event) => set('roomType', event.target.value)}
			>
				<MenuItem value="">Any room</MenuItem>
				{Object.values(RoomType).map((value) => (
					<MenuItem key={value} value={value}>
						{searchLabels[value]}
					</MenuItem>
				))}
			</Field>
			<Field
				select
				label="Guest rating"
				value={draft.minRating || ''}
				onChange={(event) => set('minRating', event.target.value)}
			>
				<MenuItem value="">Any rating</MenuItem>
				{[3, 4, 4.5].map((value) => (
					<MenuItem key={value} value={String(value)}>
						{value}+ stars
					</MenuItem>
				))}
			</Field>
			<fieldset>
				<legend>Little essentials</legend>
				<div className="h-amenity-options">
					{Object.values(HotelAmenity).map((value) => (
						<FormControlLabel
							key={value}
							label={searchLabels[value]}
							control={
								<Checkbox
									size="small"
									checked={amenities.includes(value)}
									onChange={(event) =>
										set(
											'amenities',
											(event.target.checked ? [...amenities, value] : amenities.filter((item) => item !== value)).join(
												',',
											),
										)
									}
								/>
							}
						/>
					))}
				</div>
			</fieldset>
			{error && <Alert severity="error">{error}</Alert>}
			<Button fullWidth color="secondary" type="submit" disabled={pending}>
				{pending ? 'Applying…' : 'Show stays'}
			</Button>
			<Button
				fullWidth
				variant="text"
				disabled={pending}
				onClick={() => {
					const cleared = { ...hotelSearchQuery(input) };
					filterKeys.forEach((key) => delete cleared[key]);
					setDraft(cleared);
				}}
			>
				Reset filters
			</Button>
		</form>
	);
}
