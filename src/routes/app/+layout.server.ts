import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
const PUBLIC_API_URL = env.PUBLIC_API_URL;

export const load: LayoutServerLoad = async ({ cookies, fetch, params }) => {
	const token = cookies.get('token');

	if (!token) {
		throw redirect(302, '/login');
	}

	try {
		const response = await fetch(PUBLIC_API_URL + '/auth/profile', {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			return { user: null };
		}
		const user = await response.json();
		if (params.org_id) {
			const res = await fetch(PUBLIC_API_URL + '/organizations/' + params.org_id, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			let org = await res.json();
			return {
				user,
				role: org.members.find((m: any) => m.user._id === user.id).role
			};
		}

		return { user };
	} catch (error) {
		return { user: null };
	}
};
