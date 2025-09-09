import { api } from '$lib/api';

export const ssr = false;

export const load = async ({ params }) => {
	return {
		organizations: await api.getUserOrganizations(),
		organization: await api.getOrganization(params.org_id),
		organization_id: params.org_id || null
	};
};
