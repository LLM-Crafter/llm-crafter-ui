<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';

	let { children } = $props();

	// Initialize theme on mount
	onMount(() => {
		// Apply initial theme class
		if ($theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	});
</script>

<svelte:head>
	<title>LLM Crafter - APP</title>
</svelte:head>

{@render children()}
