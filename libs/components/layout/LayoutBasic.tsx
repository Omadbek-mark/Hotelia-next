import { ComponentType } from 'react';
import PublicLayout from './PublicLayout';
export default function withLayout(Component: ComponentType<any>) {
	return function HoteliaPage(props: any) {
		return (
			<PublicLayout>
				<Component {...props} />
			</PublicLayout>
		);
	};
}
