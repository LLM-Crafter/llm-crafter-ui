<script lang="ts">
	import CreateProjectModal from '$lib/ui/modal/CreateProjectModal.svelte';
	import { createEventDispatcher } from 'svelte';

	export let data;
	const dispatch = createEventDispatcher();

	let showModal = false;

	function handleCreated(newProject) {
		// Close modal
		showModal = false;
		// Optional: append project to the list locally
		data.projects = [newProject, ...data.projects];
	}
</script>

<div class="mb-6 flex items-center justify-between">
	<button
		class="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
		on:click={() => (showModal = true)}
	>
		+ Create Project
	</button>
</div>

<div id="projects-list" class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
	{#each data.projects as project}
		<div class="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
			<h3 class="mb-2 text-xl font-semibold text-gray-100">{project.name}</h3>
			<p class="mb-4 text-gray-300">{project.description}</p>
			<div class="w-full">
				<a
					href={`/app/org/${data.organization_id}/project/${project._id}`}
					class="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Open Project
				</a>
			</div>
		</div>
	{/each}
</div>

{#if showModal}
	<CreateProjectModal
		{data}
		on:close={() => (showModal = false)}
		on:created={(e) => handleCreated(e.detail)}
	/>
{/if}
