import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	const parentData = await parent();

	return {
		...parentData,
		organization_id: params.org_id,
		agent_id: params.agent_id
	};
};
