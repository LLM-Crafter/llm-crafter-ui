<script lang="ts">
	export let data;
</script>

<div id="projects-list" class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
	{#each data.projects as project}
		<div class="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
			<h3 class="mb-2 text-xl font-semibold text-gray-100">{project.name}</h3>
			<p class="mb-4 text-gray-300">{project.description}</p>
			<div class="w-full">
				<a
					href="/app/org/{data.organization_id}/project/{project._id}"
					class="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>Open Project</a
				>
			</div>
		</div>
	{/each}
</div>
