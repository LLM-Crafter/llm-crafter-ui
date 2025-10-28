<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let status = 'processing';
	let message = 'Completing Google authentication...';
	let debugInfo = '';

	onMount(async () => {
		try {
			// Get the authorization code from URL
			const code = $page.url.searchParams.get('code');
			const error = $page.url.searchParams.get('error');

			if (error) {
				throw new Error(error);
			}

			if (!code) {
				throw new Error('No authorization code received');
			}

			message = 'Exchanging authorization code for tokens...';

			// Exchange code for tokens via our server endpoint
			const response = await fetch('/auth/google/exchange', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ code })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to exchange authorization code');
			}

			const tokens = await response.json();

			// Send the tokens back to the parent window
			if (window.opener) {
				window.opener.postMessage(
					{
						type: 'google-oauth-success',
						access_token: tokens.access_token,
						refresh_token: tokens.refresh_token,
						email: tokens.email
					},
					window.location.origin
				);

				status = 'success';
				message = 'Authentication successful! Configuring calendar...';

				// Auto-close after 1 second
				setTimeout(() => {
					window.close();
				}, 1000);
			} else {
				throw new Error('Parent window not found');
			}
		} catch (err) {
			status = 'error';
			message = err.message || 'Authentication failed';
			debugInfo = err.stack || '';

			// Send error back to parent window
			if (window.opener) {
				window.opener.postMessage(
					{
						type: 'google-oauth-error',
						error: message
					},
					window.location.origin
				);

				// Auto-close after 3 seconds
				setTimeout(() => {
					window.close();
				}, 3000);
			}
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-950">
	<div class="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
		{#if status === 'processing'}
			<div class="mb-4 flex justify-center">
				<i class="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
			</div>
			<h2 class="mb-2 text-xl font-bold text-white">Processing...</h2>
			<p class="text-gray-400">{message}</p>
		{:else if status === 'success'}
			<div class="mb-4 flex justify-center">
				<div class="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
					<i class="fas fa-check text-3xl text-green-500"></i>
				</div>
			</div>
			<h2 class="mb-2 text-xl font-bold text-white">Success!</h2>
			<p class="text-gray-400">{message}</p>
		{:else if status === 'error'}
			<div class="mb-4 flex justify-center">
				<div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
					<i class="fas fa-times text-3xl text-red-500"></i>
				</div>
			</div>
			<h2 class="mb-2 text-xl font-bold text-white">Error</h2>
			<p class="text-red-400">{message}</p>
			{#if debugInfo}
				<div class="mt-4 rounded-lg bg-yellow-500/10 p-4 text-left">
					<pre class="whitespace-pre-wrap text-xs text-yellow-300">{debugInfo}</pre>
				</div>
			{/if}
		{/if}
	</div>
</div>
