<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { api } from '$lib/api';

	export let data; // we need organization_id
	const dispatch = createEventDispatcher();

	let name = '';
	let description = '';
	let loading = false;
	let error = '';

	async function createProject() {
		loading = true;
		error = '';

		try {
			const res = await api.fetch(`/organizations/${data.organization_id}/projects`, {
				method: 'POST',
				body: JSON.stringify({ name, description })
			});

			if (!res.ok) throw new Error('Failed to create project');

			const project = await res.json();
			dispatch('created', project);
		} catch (err) {
			error = err.message || 'Something went wrong';
		} finally {
			loading = false;
		}
	}
</script>

<!-- BACKDROP -->
<div class="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-70">
	<!-- MODAL -->
	<div class="w-full max-w-lg rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-xl">
		<h2 class="mb-4 text-xl font-bold text-white">Create Project</h2>

		<form on:submit|preventDefault={createProject}>
			<div class="mb-4">
				<label class="mb-1 block text-sm text-gray-300" for="name">Name</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					required
					disabled={loading}
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div class="mb-4">
				<label class="mb-1 block text-sm text-gray-300" for="description">Description</label>
				<textarea
					id="description"
					bind:value={description}
					rows="3"
					disabled={loading}
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500"
				></textarea>
			</div>

			{#if error}
				<p class="mb-4 text-red-500">{error}</p>
			{/if}

			<div class="flex justify-end gap-3">
				<button
					type="button"
					class="rounded-lg bg-gray-700 px-4 py-2 text-gray-200 hover:bg-gray-600"
					on:click={() => dispatch('close')}
					disabled={loading}
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={loading}
					class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					{loading ? 'Creating...' : 'Create'}
				</button>
			</div>
		</form>
	</div>
</div>
