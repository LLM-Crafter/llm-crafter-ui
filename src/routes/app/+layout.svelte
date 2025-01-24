<script lang="ts">
	import { onMount } from 'svelte';
	import { token } from '$lib/stores/auth';
	import { api } from '$lib/api';
	import { goto } from '$app/navigation';

	let loading = true;
	let error = false;

	onMount(async () => {
		if (!$token) {
			goto('/login');
			return;
		}

		try {
			await api.getProfile();
			loading = false;
		} catch (err) {
			error = true;
			token.set(null);
			goto('/login');
		}
	});
</script>

{#if loading}
	<div>Loading...</div>
{:else}
	<slot />
{/if}
