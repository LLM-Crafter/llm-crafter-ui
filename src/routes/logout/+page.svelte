<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { logout } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	onMount(() => {
		logout();
		if (browser) {
			goto('/login');
		}
	});
</script>

<div
	id="logout-screen"
	class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950"
>
	<p class="text-gray-800 dark:text-gray-100">Logging out...</p>
</div>
