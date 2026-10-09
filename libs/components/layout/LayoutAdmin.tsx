import React, { ComponentType } from 'react';
import DashboardLayout, { adminNavigation } from '../hotelia/DashboardLayout';
import { MemberType } from '../../types/hotelia/enums';

export default function withAdminLayout(Component: ComponentType<any>) {
	return function HoteliaAdminPage(props: any) {
		return <DashboardLayout title="Administration" role={MemberType.ADMIN} navigation={adminNavigation}>
			<div id="pc-wrap" className="admin"><Component {...props} /></div>
		</DashboardLayout>;
	};
}
