<script lang="ts">
	import { token } from '$lib/stores/auth';
	import { api } from '$lib/api';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ThemeToggle from '$lib/ui/ThemeToggle.svelte';
	import OAuthButton from '$lib/ui/OAuthButton.svelte';
	import { browser } from '$app/environment';
	import type { OAuthProvidersResponse } from '$lib/api';

	let name: string = '';
	let email: string = '';
	let password: string = '';
	let error: string = '';
	let loading: boolean = false;
	let oauthProviders: OAuthProvidersResponse | null = null;
	let oauthLoading: boolean = true;

	onMount(async () => {
		if ($token && browser) {
			goto('/app');
		}

		// Load OAuth providers
		try {
			oauthProviders = await api.getOAuthProviders();
		} catch (err) {
			console.error('Failed to load OAuth providers:', err);
		} finally {
			oauthLoading = false;
		}
	});

	async function handleSubmit() {
		loading = true;
		error = '';

		try {
			// Call API register endpoint
			const authToken = await api.register(name, email, password);
			token.set(authToken);
			goto('/app');
		} catch (err: any) {
			error = err?.message || 'Registration failed';
		} finally {
			loading = false;
		}
	}

	function handleOAuthLogin(provider: 'google' | 'github') {
		const providerConfig = enabledProviders.find((p) => p.name === provider);
		if (providerConfig) {
			// Use the authUrl from the API response, or fallback to API base + authUrl
			const authUrl = providerConfig.authUrl.startsWith('http')
				? providerConfig.authUrl
				: `${api.getApiUrl()}${providerConfig.authUrl}`;
			window.location.href = authUrl;
		}
	}

	// Get available OAuth providers
	$: enabledProviders = oauthProviders?.data?.providers || [];
</script>

<div
	id="register-screen"
	class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950"
>
	<!-- Theme Toggle -->
	<div class="absolute right-4 top-4">
		<ThemeToggle size="md" />
	</div>

	<div
		class="w-96 rounded-lg border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800"
	>
		<h1 class="mb-6 text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
			Create Account
		</h1>

		<!-- OAuth Buttons -->
		{#if !oauthLoading && enabledProviders.length > 0}
			<div class="mb-6 space-y-3">
				{#each enabledProviders as provider}
					{#if provider.name === 'google'}
						<OAuthButton
							provider="google"
							disabled={loading}
							onClick={() => handleOAuthLogin('google')}
						/>
					{:else if provider.name === 'github'}
						<OAuthButton
							provider="github"
							disabled={loading}
							onClick={() => handleOAuthLogin('github')}
						/>
					{/if}
				{/each}
			</div>

			<!-- Divider -->
			<div class="mb-6 flex items-center">
				<div class="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
				<div class="mx-3 text-sm text-gray-500 dark:text-gray-400">or</div>
				<div class="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit}>
			<div class="mb-4">
				<label for="name" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>Full Name</label
				>
				<input
					type="text"
					id="name"
					bind:value={name}
					required
					disabled={loading}
					placeholder="Your full name"
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
				/>
			</div>
			<div class="mb-4">
				<label for="email" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>Email</label
				>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					disabled={loading}
					placeholder="Enter your email"
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
				/>
			</div>
			<div class="mb-6">
				<label
					for="password"
					class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label
				>
				<input
					type="password"
					id="password"
					bind:value={password}
					required
					disabled={loading}
					placeholder="Create a password"
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
				/>
			</div>
			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
			>
				{loading ? 'Creating Account...' : 'Sign Up'}
			</button>
			{#if error}
				<div class="mt-4 text-center">
					<p class="text-red-500">{error}</p>
				</div>
			{/if}
		</form>
		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Already have an account?
				<a
					href="/login"
					class="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
					>Login</a
				>
			</p>
		</div>
	</div>
</div>
