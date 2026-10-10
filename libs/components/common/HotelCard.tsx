import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { IconButton } from '@mui/material';
import Link from 'next/link';
import type { HotelCardData } from '../../../apollo/user/discovery';
import { Chip, formatUsd, SiteImage } from './ui';
import HotelMetrics from './HotelMetrics';

const labels: Record<string, string> = {
	WIFI: 'Wi-Fi',
	POOL: 'Pool',
	PARKING: 'Parking',
	BREAKFAST: 'Breakfast',
	GYM: 'Gym',
	SPA: 'Spa',
	AIR_CONDITIONING: 'Air conditioning',
	RESTAURANT: 'Restaurant',
};

export default function HotelCard({
	hotel,
	onFavorite,
	saving = false,
	stayQuery = {},
}: {
	hotel: HotelCardData;
	onFavorite?: (hotel: HotelCardData) => void;
	saving?: boolean;
	stayQuery?: Record<string, string>;
}) {
	const href = { pathname: '/hotel/detail', query: { ...stayQuery, hotelId: hotel._id } };
	return (
		<article className="h-card h-hotel-card">
			<div className="h-card-photo">
				<Link href={href} aria-label={`View ${hotel.hotelName}`}>
					<SiteImage src={hotel.hotelImages[0]} alt={hotel.hotelName} />
				</Link>
				<span className="h-location-chip">
					{hotel.hotelCity}, {hotel.hotelCountry}
				</span>
				{onFavorite && (
					<IconButton
						className="h-favorite"
						disabled={saving}
						onClick={() => onFavorite(hotel)}
						aria-label={`${hotel.isFavorite ? 'Unsave' : 'Save'} ${hotel.hotelName}`}
						aria-pressed={!!hotel.isFavorite}
					>
						{hotel.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
					</IconButton>
				)}
			</div>
			<div className="h-card-body">
				<div className="h-card-title-row">
					<h3>
						<Link href={href}>{hotel.hotelName}</Link>
					</h3>
					{hotel.startingPrice != null && (
						<span className="h-price">
							{formatUsd(hotel.startingPrice)}
							<small>/ night</small>
						</span>
					)}
				</div>
				<div className="h-chips">
					{hotel.hotelAmenities.slice(0, 3).map((amenity) => (
						<Chip key={amenity}>{labels[amenity] || amenity}</Chip>
					))}
				</div>
				<HotelMetrics views={hotel.hotelViews} likes={hotel.hotelLikes} saved={hotel.isFavorite} />
				<div className="h-card-bottom">
					<Link href={href} className="h-text-link">
						View hotel <ArrowForwardIcon fontSize="small" />
					</Link>
					{hotel.hotelReviews > 0 && (
						<span className="h-rating">
							<StarRoundedIcon fontSize="small" />
							{hotel.hotelRating.toFixed(1)}
							<small>({hotel.hotelReviews})</small>
						</span>
					)}
				</div>
			</div>
		</article>
	);
}
