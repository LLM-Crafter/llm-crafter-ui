<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { token } from '$lib/stores/auth';
	import { browser } from '$app/environment';

	let loading = true;
	let error = '';

	onMount(() => {
		if (!browser) return;

		const urlParams = new URLSearchParams(window.location.search);
		const authToken = urlParams.get('token');

		if (authToken) {
			token.set(authToken);
			// Small delay to ensure token is stored
			setTimeout(() => {
				goto('/app');
			}, 100);
		} else {
			error = 'No authentication token received';
			loading = false;
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
	<div
		class="w-96 rounded-lg border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800"
	>
		{#if loading}
			<div class="text-center">
				<div class="mb-4 flex justify-center">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
					></div>
				</div>
				<h1 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-gray-100">
					Logging you in...
				</h1>
				<p class="text-gray-600 dark:text-gray-400">
					Please wait while we complete your authentication.
				</p>
			</div>
		{:else if error}
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
				<p class="mb-4 text-gray-600 dark:text-gray-400">
					{error}
				</p>
				<a
					href="/login"
					class="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					Return to Login
				</a>
			</div>
		{/if}
	</div>
</div>
