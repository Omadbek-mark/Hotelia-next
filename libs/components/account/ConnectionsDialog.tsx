import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Connections from './Connections';
export default function ConnectionsDialog({
	memberId,
	name,
	kind,
	onClose,
}: {
	memberId: string;
	name: string;
	kind: 'followers' | 'followings';
	onClose: () => void;
}) {
	return (
		<Dialog
			open
			onClose={onClose}
			fullWidth
			maxWidth="sm"
			className="h-circle-dialog"
			aria-labelledby="hotelia-circle-title"
		>
			<DialogTitle id="hotelia-circle-title">
				<span>
					{kind === 'followers' ? 'Followers' : 'Following'}
					<small>{name}'s circle</small>
				</span>
				<IconButton onClick={onClose} aria-label="Close connections">
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent>
				<Connections key={`${memberId}:${kind}`} memberId={memberId} kind={kind} compact />
			</DialogContent>
		</Dialog>
	);
}
