import type { LayoutServerLoad } from './$types';
import { api } from '$lib/api';
import { redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
    const token = cookies.get('token');
    
    if (!token) {
        throw redirect(302, '/login');
    }

    try {
        const response = await fetch(PUBLIC_API_URL + '/auth/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            return { user: null };
        }

        const user = await response.json();
        return { user };
    } catch (error) {
        return { user: null };
    }
};
