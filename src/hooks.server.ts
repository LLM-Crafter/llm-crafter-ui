import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1];

	// if (token) {
	//     event.cookies.set('token', token, {
	//         path: '/',
	//         httpOnly: true,
	//         sameSite: 'strict',
	//         secure: process.env.NODE_ENV === 'production'
	//     });
	// }

	return resolve(event);
};
