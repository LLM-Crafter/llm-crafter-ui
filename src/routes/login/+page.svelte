<script lang="ts">
	import { token } from '$lib/stores/auth';
	import { api } from '$lib/api';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
	let error = '';
	let loading = false;

	onMount(() => {
		if ($token) {
			goto('/app');
		}
	});

	async function handleSubmit() {
		loading = true;
		error = '';

		try {
			let authToken = await api.login(email, password);
			token.set(authToken);
			console.log($token);
			goto('/app');
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<div id="login-screen" class="flex min-h-screen items-center justify-center bg-gray-950">
	<div class="w-96 rounded-lg border border-gray-800 bg-gray-900 p-8 shadow-lg">
		<h1 class="mb-6 text-center text-3xl font-semibold text-gray-100">LLM Crafter</h1>
		<form on:submit|preventDefault={handleSubmit}>
			<div class="mb-4">
				<label for="email" class="mb-1 block text-sm font-medium text-gray-300"
					>Email or Username</label
				>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					disabled={loading}
					placeholder="Enter your email or username"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div class="mb-6">
				<label for="password" class="mb-1 block text-sm font-medium text-gray-300">Password</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					required
					disabled={loading}
					placeholder="Enter your password"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				{loading ? 'Loading...' : 'Login'}</button
			>
			{#if error}
				<div class="mt-4 text-center">
					<p class="text-red-500">{error}</p>
				</div>
			{/if}
		</form>
		<div class="mt-4 text-center">
			<a href="#" class="text-sm text-blue-400 hover:text-blue-300">Forgot password?</a>
		</div>
		<div class="mt-6 text-center">
			<p class="text-sm text-gray-400">
				Don't have an account? <a href="#" class="text-blue-400 hover:text-blue-300">Sign Up</a>
			</p>
		</div>
	</div>
</div>
