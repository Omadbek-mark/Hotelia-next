import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';

export default function HotelMetrics({
	views,
	likes,
	saved = false,
}: {
	views?: number;
	likes?: number;
	saved?: boolean | null;
}) {
	const valid = (count?: number) => typeof count === 'number' && Number.isFinite(count) && count >= 0;
	return (
		<div className="h-hotel-metrics">
			{valid(views) && (
				<span aria-label={`${views} views`} title={`${views} views`}>
					<VisibilityOutlinedIcon />
					<span>{views!.toLocaleString('en-US')}</span>
				</span>
			)}
			{valid(likes) && (
				<span className={saved ? 'is-saved' : undefined} aria-label={`${likes} likes`} title={`${likes} likes`}>
					<FavoriteIcon />
					<span>{likes!.toLocaleString('en-US')}</span>
				</span>
			)}
		</div>
	);
}
