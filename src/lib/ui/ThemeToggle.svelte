<script lang="ts">
	import { theme, toggleTheme } from '$lib/stores/theme';

	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let showLabel = false;

	$: iconSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base';
	$: buttonSize = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2';
</script>

<button
	on:click={toggleTheme}
	class="rounded-lg border border-gray-300 bg-white text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 {buttonSize}"
	title={$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
	aria-label={$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
>
	<div class="flex items-center space-x-2">
		{#if $theme === 'dark'}
			<i class="fas fa-sun {iconSize} text-yellow-500"></i>
		{:else}
			<i class="fas fa-moon {iconSize} text-blue-600"></i>
		{/if}
		{#if showLabel}
			<span class="text-sm font-medium">
				{$theme === 'dark' ? 'Light' : 'Dark'}
			</span>
		{/if}
	</div>
</button>
