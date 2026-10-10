import SystemState from '../libs/components/common/SystemState';
export default function ServerError() {
	return (
		<SystemState
			code="500"
			title="A moment to reset."
			description="We could not open this page. Please try again in a moment."
		/>
	);
}
