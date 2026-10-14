import type { MemberUpdate } from '../types/contracts';

export function profileUpdate(draft: {
	memberNick: string;
	memberEmail: string;
	memberPhone: string;
	memberFullName: string;
	memberAddress: string;
	memberDesc: string;
	memberImage: string;
}): MemberUpdate {
	const memberNick = draft.memberNick.trim();
	if (memberNick.length < 3 || memberNick.length > 12) throw new Error('Nickname must contain 3–12 characters.');
	const memberFullName = draft.memberFullName.trim();
	if (memberFullName && (memberFullName.length < 3 || memberFullName.length > 100))
		throw new Error('Full name must contain 3–100 characters.');
	return {
		memberNick,
		...(draft.memberEmail.trim() ? { memberEmail: draft.memberEmail.trim().toLowerCase() } : {}),
		...(draft.memberPhone.trim() ? { memberPhone: draft.memberPhone.trim() } : {}),
		...(memberFullName ? { memberFullName } : {}),
		memberAddress: draft.memberAddress.trim(),
		memberDesc: draft.memberDesc.trim(),
		memberImage: draft.memberImage,
	};
}

export function profileError(error: unknown): string {
	const message = error instanceof Error ? error.message : '';
	if (/used|already|duplicate|conflict/i.test(message)) return 'This nickname, email or phone is already in use.';
	if (/unauthenticated|not authenticated|unauthorized/i.test(message)) return 'Your session has expired. Log in again.';
	if (/Nickname must|Full name must/.test(message)) return message;
	return 'Could not save your profile. Check your details and try again.';
}
