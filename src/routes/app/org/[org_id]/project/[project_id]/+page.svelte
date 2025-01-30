<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/api.js';

	export let data;

	async function deletePrompt(promptId) {
		const response = await api.deletePrompt(data.organization_id, data.project._id, promptId);
		if (response) {
			invalidateAll();
		}
	}
</script>

<div id="project-details">
	<div class="mb-8 flex items-center justify-between">
		<h1 id="project-name" class="text-2xl font-semibold text-gray-100">{data.project.name}</h1>
		<div class="flex space-x-4">
			<a
				href="/app/org/{data.organization_id}/project/{data.project._id}/config"
				class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>Configuration</a
			>
			<a
				href="/app/org/{data.organization_id}/project/{data.project._id}/add"
				class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>Add Prompt</a
			>
			<a
				href="/app/org/{data.organization_id}"
				class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>Back to Projects</a
			>
		</div>
	</div>

	<!-- Project Content (Placeholder) -->
	<div class="rounded-lg border border-gray-800 bg-gray-900 p-4 text-white shadow-lg">
		<h2 class="mb-4 text-lg font-semibold">All Prompts</h2>
		<table class="w-full border-collapse text-left">
			<thead>
				<tr>
					<th class="border-b border-gray-800 p-3">Name</th>
					<th class="max-w-12 border-b border-gray-800 p-3 text-right">Actions</th>
				</tr>
			</thead>
			<tbody id="prompts-list">
				<!-- Example Prompt Row -->
				{#each data.project.prompts as prompt}
					<tr>
						<td class="border-b border-gray-800 p-3">{prompt.name}</td>
						<td class="max-w-12 border-b border-gray-800 p-3 text-right">
							<a
								href="/app/org/{data.organization_id}/project/{data.project
									._id}/prompt/{prompt._id}"
								class="mr-2 rounded-lg bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
								>Open</a
							>
							<button
								on:click={() => deletePrompt(prompt._id)}
								class="rounded-lg bg-red-600 px-3 py-1 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
								>Delete</button
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
