<script lang="ts">
	import { goto } from '$app/navigation';
	import { logout } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	onMount(() => {
		logout();
		goto('/login');
	});
</script>

test
