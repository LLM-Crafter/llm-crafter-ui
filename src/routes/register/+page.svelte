<script lang="ts">
	import { token } from '$lib/stores/auth';
	import { api } from '$lib/api';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let name: string = '';
	let email: string = '';
	let password: string = '';
	let error: string = '';
	let loading: boolean = false;

	onMount(() => {
		if ($token) {
			goto('/app');
		}
	});

	async function handleSubmit() {
		loading = true;
		error = '';

		try {
			// Call API register endpoint
			const authToken = await api.register(name, email, password);
			token.set(authToken);
			goto('/app/select-organization');
		} catch (err: any) {
			error = err?.message || 'Registration failed';
		} finally {
			loading = false;
		}
	}
</script>

<div id="register-screen" class="flex min-h-screen items-center justify-center bg-gray-950">
	<div class="w-96 rounded-lg border border-gray-800 bg-gray-900 p-8 shadow-lg">
		<h1 class="mb-6 text-center text-3xl font-semibold text-gray-100">Create Account</h1>
		<form on:submit|preventDefault={handleSubmit}>
			<div class="mb-4">
				<label for="name" class="mb-1 block text-sm font-medium text-gray-300">Full Name</label>
				<input
					type="text"
					id="name"
					bind:value={name}
					required
					disabled={loading}
					placeholder="Your full name"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div class="mb-4">
				<label for="email" class="mb-1 block text-sm font-medium text-gray-300">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					disabled={loading}
					placeholder="Enter your email"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
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
					placeholder="Create a password"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
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
			<p class="text-sm text-gray-400">
				Already have an account?
				<a href="/login" class="text-blue-400 hover:text-blue-300">Login</a>
			</p>
		</div>
	</div>
</div>
