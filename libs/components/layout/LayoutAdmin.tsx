import React, { ComponentType } from 'react';
import { MemberType } from '../../enums';
import DashboardLayout, { adminNavigation } from './DashboardLayout';

export default function withAdminLayout(Component: ComponentType<any>) {
	return function HoteliaAdminPage(props: any) {
		return (
			<DashboardLayout title="Administration" role={MemberType.ADMIN} navigation={adminNavigation}>
				<div id="pc-wrap" className="admin">
					<Component {...props} />
				</div>
			</DashboardLayout>
		);
	};
}
