import SystemState from '../libs/components/common/SystemState';
export default function NotFound() {
	return (
		<SystemState
			code="404"
			title="A little off the map."
			description="This page may have moved. Your next stay is still waiting."
		/>
	);
}
