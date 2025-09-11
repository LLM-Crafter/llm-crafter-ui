import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { api } from '$lib/api';

export const ssr = false;

export const load: LayoutLoad = async ({ params }) => {
	try {
		const response = await api.getProfile();
		if (!response) {
			return { user: null };
		}
		if (params.org_id) {
			const res = await api.getOrganization(params.org_id);
			if (!res) {
				throw redirect(302, '/app');
			}

			return {
				user: response,
				role: res.members.find((m: any) => m.user._id === response.id).role
			};
		}

		return { user: response };
	} catch (error) {
		return { user: null };
	}
};
