import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ parent }) {
	const data = await parent();
	
	// Return the necessary data for the handoffs page
	return {
		...data
	};
}
