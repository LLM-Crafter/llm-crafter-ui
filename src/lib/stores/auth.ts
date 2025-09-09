import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

const storedToken = browser ? localStorage.getItem('token') : null;
export const token = writable<string | null>(storedToken);

if (browser) {
	token.subscribe((value) => {
		if (value) {
			localStorage.setItem('token', value);
			document.cookie = `token=${value}; path=/`;
		} else {
			localStorage.removeItem('token');
			document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		}
	});
}

export async function logout() {
	try {
		await fetch('/auth/logout', { method: 'POST' });
	} finally {
		token.set(null);
		goto('/login');
	}
}
