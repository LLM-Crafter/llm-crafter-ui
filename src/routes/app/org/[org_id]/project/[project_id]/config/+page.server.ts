import { api } from '$lib/api';

export const ssr = false;

export const load = async ({ params }) => {
	return {
		providers: await api.getProviders()
	};
};
