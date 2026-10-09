import React, { ComponentType } from 'react';
import PublicLayout from '../hotelia/PublicLayout';
import useDeviceDetect from '../../hooks/useDeviceDetect';

export default function withLayout(Component: ComponentType<any>) {
	return function HoteliaPage(props: any) {
		const device = useDeviceDetect();
		return <PublicLayout legacyId={device === 'mobile' ? 'mobile-wrap' : 'pc-wrap'}><Component {...props} /></PublicLayout>;
	};
}
