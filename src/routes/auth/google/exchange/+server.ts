import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { code } = await request.json();

		if (!code) {
			return json({ error: 'Authorization code is required' }, { status: 400 });
		}

		if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
			return json({ error: 'Google OAuth credentials not configured' }, { status: 500 });
		}

		// Exchange authorization code for tokens
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				code: code,
				client_id: GOOGLE_CLIENT_ID,
				client_secret: GOOGLE_CLIENT_SECRET,
				redirect_uri: GOOGLE_REDIRECT_URI,
				grant_type: 'authorization_code'
			})
		});

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.json();
			return json(
				{ error: errorData.error_description || 'Failed to exchange authorization code' },
				{ status: 400 }
			);
		}

		const tokens = await tokenResponse.json();

		// Get user info
		const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: {
				Authorization: `Bearer ${tokens.access_token}`
			}
		});

		let email = '';
		if (userInfoResponse.ok) {
			const userInfo = await userInfoResponse.json();
			email = userInfo.email;
		}

		// Return tokens to the frontend
		return json({
			access_token: tokens.access_token,
			refresh_token: tokens.refresh_token,
			email: email
		});
	} catch (error) {
		console.error('Token exchange error:', error);
		return json({ error: 'Failed to exchange authorization code' }, { status: 500 });
	}
};
