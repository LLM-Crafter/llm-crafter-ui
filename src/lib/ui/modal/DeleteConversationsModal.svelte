<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { api } from '$lib/api';

	export let data;
	export let agent;

	const dispatch = createEventDispatcher();

	let deleting = false;
	let error = '';

	async function handleDelete() {
		try {
			deleting = true;
			error = '';
			const result = await api.deleteAgentConversations(
				data.organization_id,
				data.project._id,
				agent._id
			);
			dispatch('deleted', result);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete conversations';
		} finally {
			deleting = false;
		}
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
	<div
		class="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
	>
		<!-- Header -->
		<div
			class="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800"
		>
			<div class="flex items-center space-x-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
					<i class="fas fa-trash-alt text-red-500"></i>
				</div>
				<h2 class="text-lg font-bold text-gray-900 dark:text-white">Delete Conversations</h2>
			</div>
			<button
				on:click={() => dispatch('close')}
				class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
			>
				<i class="fas fa-times"></i>
			</button>
		</div>

		<!-- Body -->
		<div class="p-6">
			<p class="text-gray-700 dark:text-gray-300">
				Are you sure you want to delete <span class="font-semibold">all conversations</span> for
				<span class="font-semibold">{agent.name}</span>?
			</p>
			<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
				This action cannot be undone. All conversation history and messages will be permanently
				removed.
			</p>

			{#if error}
				<div
					class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
				>
					<i class="fas fa-exclamation-circle mr-1"></i>
					{error}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div
			class="flex items-center justify-end space-x-3 border-t border-gray-200 p-6 dark:border-gray-800"
		>
			<button
				on:click={() => dispatch('close')}
				disabled={deleting}
				class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				Cancel
			</button>
			<button
				on:click={handleDelete}
				disabled={deleting}
				class="inline-flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
			>
				{#if deleting}
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
					></div>
					<span>Deleting...</span>
				{:else}
					<i class="fas fa-trash-alt"></i>
					<span>Delete All Conversations</span>
				{/if}
			</button>
		</div>
	</div>
</div>
