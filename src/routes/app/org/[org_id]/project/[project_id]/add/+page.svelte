<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api, type ApiKeyDTO } from '$lib/api.js';

	export let data;
	console.log(data);
</script>

<div id="project-details">
	<div class="mb-8 flex items-center justify-between">
		<h1 id="project-name" class="text-2xl font-semibold text-gray-100">{data.project.name}</h1>
		<div class="flex space-x-4">
			<a
				href="/app/org/{data.organization_id}/project/{data.project._id}"
				class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>Back to prompts
			</a>
			<a
				href="/app/org/{data.organization_id}"
				class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>Back to Projects</a
			>
		</div>
	</div>

	<div class="mb-8 rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
		<h2 class="mb-4 text-xl font-semibold text-gray-100">Create a New Prompt</h2>
		<form id="create-prompt-form" class="flex items-center space-x-4">
			<input
				type="text"
				id="new-prompt-name"
				class="flex-1 rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
				placeholder="Enter prompt name"
				required
			/>
			<button
				type="submit"
				class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>Create</button
			>
		</form>
	</div>
</div>
