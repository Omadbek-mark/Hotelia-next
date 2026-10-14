import { useHotelLocations } from '../../hooks/useHotelLocations';
import TuneIcon from '@mui/icons-material/Tune';
import { useHoteliaTranslation } from '../../hooks/useHoteliaTranslation';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Checkbox, FormControlLabel, IconButton, Slider } from '@mui/material';
import { FormEvent, useEffect, useState } from 'react';
import { hotelSearchQuery, parseHotelSearch, searchLabels } from '../../search/hotel-search';
import type { HotelsInquiry } from '../../types/contracts';
import { HotelAmenity, HotelType, RoomType } from '../../enums';
import { Button, Field } from '../common/ui';

const filterKeys = ['cities', 'text', 'minPrice', 'maxPrice', 'hotelType', 'roomType', 'minRating', 'amenities'] as const;

export default function Filters({
	input,
	apply,
	close,
}: {
	input: HotelsInquiry;
	apply: (input: HotelsInquiry) => Promise<unknown>;
	close?: () => void;
}) {
	const tr = useHoteliaTranslation();
	const { locations, loading: locationsLoading, error: locationsError, retry } = useHotelLocations();
	const [draft, setDraft] = useState<Record<string, string>>(hotelSearchQuery(input));
	const [error, setError] = useState('');
	const [pending, setPending] = useState(false);
	const [citiesExpanded, setCitiesExpanded] = useState(false);
	const cities = (draft.cities || '').split(',').filter(Boolean);
	useEffect(() => {
		const next = hotelSearchQuery(input);
		delete next.minRating;
		setDraft(next);
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
	const reset = async () => {
		const cleared: Record<string, string> = { ...hotelSearchQuery(input), page: '1' };
		filterKeys.forEach((key) => delete cleared[key]);
		setDraft(cleared);
		setError('');
		setPending(true);
		try {
			await apply(parseHotelSearch(cleared).input);
		} catch {
			setError('Could not reset filters. Try again.');
		} finally {
			setPending(false);
		}
	};
	const rangeMax = Math.max(
		1000,
		Math.ceil(Math.max(Number(draft.maxPrice) || 0, Number(draft.minPrice) || 0) / 100) * 100,
	);
	const range: [number, number] = [Number(draft.minPrice) || 0, draft.maxPrice ? Number(draft.maxPrice) : rangeMax];
	const choices = (key: string, legend: string, options: { value: string; label: string }[]) => (
		<fieldset>
			<legend>{tr(legend)}</legend>
			<div className="h-filter-choices">
				{options.map(({ value, label }) => (
					<button
						key={value}
						type="button"
						disabled={pending}
						aria-pressed={(draft[key] || '') === value}
						onClick={() => set(key, value)}
					>
						{tr(label)}
					</button>
				))}
			</div>
		</fieldset>
	);
	return (
		<form className="h-catalog-filters" onSubmit={submit} aria-busy={pending}>
			<div className="h-filter-heading">
				<h2>
					<TuneIcon fontSize="small" />
					{tr('Filters')}
				</h2>
				<button className="h-filter-reset" type="button" disabled={pending} onClick={reset}>
					{tr('Reset filters')}
				</button>
				{close && (
					<IconButton aria-label={tr('Close filters')} onClick={close}>
						<CloseIcon />
					</IconButton>
				)}
			</div>
			<Field label={tr('Hotel name')} value={draft.text || ''} inputProps={{ maxLength: 100 }} onChange={(event) => set('text', event.target.value)} />
			<fieldset className="h-city-filter" onMouseEnter={() => setCitiesExpanded(true)} onMouseLeave={() => setCitiesExpanded(false)}>
				<legend>{tr('Location')} <button type="button" className="h-cities-toggle" aria-expanded={citiesExpanded} onClick={() => setCitiesExpanded(value => !value)}>{tr(citiesExpanded ? 'Fewer cities' : 'More cities')}</button></legend>
				<div className={`h-city-options${citiesExpanded ? ' is-expanded' : ''}`}>
					{locations.map(({ city, country }, index) => <FormControlLabel key={city} className={index >= 5 && !citiesExpanded ? 'h-city-hidden' : ''} label={<span>{tr(city)}<small>{tr(country)}</small></span>} control={<Checkbox size="small" disabled={pending} checked={cities.includes(city)} onChange={event => setDraft(previous => {
						const current = (previous.cities || '').split(',').filter(Boolean);
						const selected = event.target.checked ? [...current, city] : current.filter(item => item !== city);
						const next: Record<string, string> = { ...previous, cities: selected.join(',') };
						if (selected.length) delete next.destination;
						return next;
					})} />} />)}
				</div>
				{locationsError ? <button type="button" className="h-cities-toggle" onClick={() => retry().catch(() => {})}>{tr('Retry locations')}</button> : !locations.length && <small>{tr(locationsLoading ? 'Loading locations…' : 'No locations available')}</small>}
				{!!cities.length && <small className="h-city-selection">{cities.map(city => tr(city)).join(' · ')}</small>}
			</fieldset>
			{choices('hotelType', 'Stay type', [
				{ value: '', label: 'All' },
				...Object.values(HotelType).map((value) => ({ value, label: searchLabels[value] })),
			])}
			<fieldset>
				<legend>
					{tr('Nightly budget')}{' '}
					<small>
						{draft.minPrice || draft.maxPrice
							? `$${draft.minPrice || '0'} – ${draft.maxPrice ? `$${draft.maxPrice}` : tr('Any')} / ${tr('night')}`
							: tr('Any budget')}
					</small>
				</legend>
				<Slider
					value={range}
					min={0}
					max={rangeMax}
					step={10}
					disableSwap
					getAriaLabel={(index) => tr(index ? 'Maximum' : 'Minimum')}
					valueLabelDisplay="auto"
					onChange={(_, value) => {
						const [min, max] = value as number[];
						setDraft((previous) => ({ ...previous, minPrice: String(min), maxPrice: String(max) }));
					}}
				/>
				<div className="h-price-fields">
					<Field
						label={tr('Minimum')}
						type="number"
						value={draft.minPrice || ''}
						inputProps={{ min: 0, step: 0.01 }}
						onChange={(event) => set('minPrice', event.target.value)}
					/>
					<Field
						label={tr('Maximum')}
						type="number"
						value={draft.maxPrice || ''}
						inputProps={{ min: 0, step: 0.01 }}
						onChange={(event) => set('maxPrice', event.target.value)}
					/>
				</div>
			</fieldset>
			{choices('roomType', 'Room type', [
				{ value: '', label: 'All' },
				...Object.values(RoomType).map((value) => ({ value, label: searchLabels[value] })),
			])}
			<fieldset>
				<legend>{tr('Little essentials')}</legend>
				<div className="h-amenity-options">
					{Object.values(HotelAmenity).map((value) => (
						<FormControlLabel
							key={value}
							label={tr(searchLabels[value])}
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
				{tr(pending ? 'Applying…' : 'Show stays')}
			</Button>
		</form>
	);
}
