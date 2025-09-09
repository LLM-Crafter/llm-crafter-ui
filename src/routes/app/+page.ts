import { api } from '$lib/api';

export const ssr = false;

export const load = async () => {
	return {
		organizations: await api.getUserOrganizations()
	};
};
