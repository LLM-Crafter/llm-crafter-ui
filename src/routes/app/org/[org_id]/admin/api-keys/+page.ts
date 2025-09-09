import { error } from '@sveltejs/kit';
import { api } from '$lib/api.js';

export async function load({ params, depends }) {
	depends('api:user-api-keys');

	try {
		const [apiKeys, projects] = await Promise.all([
			api.getUserApiKeys(params.org_id),
			api.getOrganizationProjects(params.org_id)
		]);

		return {
			apiKeys,
			projects,
			organization_id: params.org_id
		};
	} catch (err) {
		console.error('Failed to load API keys:', err);
		throw error(500, 'Failed to load API keys');
	}
}
