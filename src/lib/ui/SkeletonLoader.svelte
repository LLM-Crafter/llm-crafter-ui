<!-- Skeleton loading component for cards and other elements -->
<script lang="ts">
	export let variant: 'card' | 'text' | 'circle' | 'rectangle' = 'card';
	export let width: string = 'w-full';
	export let height: string = 'h-4';
	export let count: number = 1;
</script>

{#if variant === 'card'}
	{#each Array(count) as _}
		<div
			class="animate-pulse rounded-xl border border-gray-200/50 bg-white/50 p-6 dark:border-gray-700/50 dark:bg-gray-800/50"
		>
			<!-- Header -->
			<div class="mb-4 flex items-start justify-between">
				<div class="flex items-center space-x-3">
					<div class="h-10 w-10 rounded-lg bg-gray-300 dark:bg-gray-600"></div>
					<div>
						<div class="mb-1 h-5 w-32 rounded bg-gray-300 dark:bg-gray-600"></div>
						<div class="h-3 w-16 rounded bg-gray-300 dark:bg-gray-600"></div>
					</div>
				</div>
				<div class="h-6 w-16 rounded-full bg-gray-300 dark:bg-gray-600"></div>
			</div>

			<!-- Description -->
			<div class="mb-4 space-y-2">
				<div class="h-4 w-full rounded bg-gray-300 dark:bg-gray-600"></div>
				<div class="h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600"></div>
			</div>

			<!-- Meta info -->
			<div class="mb-4 flex space-x-4">
				<div class="h-3 w-20 rounded bg-gray-300 dark:bg-gray-600"></div>
				<div class="h-3 w-16 rounded bg-gray-300 dark:bg-gray-600"></div>
			</div>

			<!-- Actions -->
			<div class="flex items-center justify-between">
				<div class="h-8 w-20 rounded-lg bg-gray-300 dark:bg-gray-600"></div>
				<div class="flex space-x-2">
					<div class="h-8 w-8 rounded-lg bg-gray-300 dark:bg-gray-600"></div>
					<div class="h-8 w-8 rounded-lg bg-gray-300 dark:bg-gray-600"></div>
				</div>
			</div>
		</div>
	{/each}
{:else if variant === 'text'}
	{#each Array(count) as _}
		<div class="animate-pulse rounded {height} {width} bg-gray-300 dark:bg-gray-600"></div>
	{/each}
{:else if variant === 'circle'}
	{#each Array(count) as _}
		<div class="animate-pulse rounded-full {height} {width} bg-gray-300 dark:bg-gray-600"></div>
	{/each}
{:else if variant === 'rectangle'}
	{#each Array(count) as _}
		<div class="animate-pulse rounded-lg {height} {width} bg-gray-300 dark:bg-gray-600"></div>
	{/each}
{/if}
