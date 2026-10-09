import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GridViewIcon from '@mui/icons-material/GridView';
import { Button, SiteImage } from './ui';

export default function PhotoGallery({ images, name }: { images: string[]; name: string }) {
	const [index, setIndex] = useState<number | null>(null);
	const photos = images.length ? images : [''];
	const move = (direction: number) =>
		setIndex((previous) => ((previous || 0) + direction + photos.length) % photos.length);
	return (
		<>
			<div className={`h-detail-gallery ${photos.length === 1 ? 'h-detail-gallery--single' : ''}`}>
				<button className="h-detail-main-photo" onClick={() => setIndex(0)} aria-label={`Open ${name} photo 1`}>
					<SiteImage src={photos[0]} alt={`${name} · photo 1`} eager />
				</button>
				{photos.length > 1 && (
					<div className="h-detail-thumbnails">
						{photos.slice(1, 3).map((src, photo) => (
							<button key={photo} onClick={() => setIndex(photo + 1)} aria-label={`Open ${name} photo ${photo + 2}`}>
								<SiteImage src={src} alt={`${name} · photo ${photo + 2}`} eager />
							</button>
						))}
					</div>
				)}
				<Button variant="outlined" className="h-all-photos" startIcon={<GridViewIcon />} onClick={() => setIndex(0)}>
					View photos · {images.length}
				</Button>
			</div>
			<Dialog
				open={index !== null}
				onClose={() => setIndex(null)}
				maxWidth="lg"
				fullWidth
				aria-labelledby="hotel-gallery-title"
				onKeyDown={(event) => {
					if (event.key === 'ArrowLeft') move(-1);
					if (event.key === 'ArrowRight') move(1);
				}}
			>
				<DialogTitle id="hotel-gallery-title">
					{name}
					<IconButton aria-label="Close photos" onClick={() => setIndex(null)} sx={{ float: 'right' }}>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<div className="h-gallery-viewer">
						<SiteImage src={photos[index || 0]} alt={`${name} · photo ${(index || 0) + 1}`} eager />
					</div>
					<div className="h-gallery-controls">
						<IconButton aria-label="Previous photo" disabled={photos.length < 2} onClick={() => move(-1)}>
							<ArrowBackIcon />
						</IconButton>
						<span aria-live="polite">
							{(index || 0) + 1} / {photos.length}
						</span>
						<IconButton aria-label="Next photo" disabled={photos.length < 2} onClick={() => move(1)}>
							<ArrowForwardIcon />
						</IconButton>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
