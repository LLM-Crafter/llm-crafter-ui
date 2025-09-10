<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let error = 'Authentication failed';

	onMount(() => {
		if (!browser) return;

		const urlParams = new URLSearchParams(window.location.search);
		const errorMessage = urlParams.get('message');

		if (errorMessage) {
			error = decodeURIComponent(errorMessage);
		}
	});

	function getErrorDescription(error: string): string {
		switch (error) {
			case 'DOMAIN_NOT_ALLOWED':
				return 'Your email domain is not allowed to access this application. Please contact your administrator.';
			case 'OAUTH_ONLY_USER':
				return 'This account requires OAuth authentication. Please use the appropriate social login button.';
			case 'access_denied':
				return 'You cancelled the authentication process. Please try again.';
			default:
				return error || 'An unexpected error occurred during authentication.';
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
	<div
		class="w-96 rounded-lg border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800"
	>
		<div class="text-center">
			<div class="mb-4 flex justify-center">
				<svg class="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
					></path>
				</svg>
			</div>
			<h1 class="mb-2 text-2xl font-semibold text-red-600 dark:text-red-400">
				Authentication Failed
			</h1>
			<p class="mb-6 text-gray-600 dark:text-gray-400">
				{getErrorDescription(error)}
			</p>
			<div class="space-y-2">
				<a
					href="/login"
					class="block w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					Try Again
				</a>
				<a
					href="/register"
					class="block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					Create Account
				</a>
			</div>
		</div>
	</div>
</div>
