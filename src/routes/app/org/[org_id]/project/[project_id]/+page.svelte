<script lang="ts">
	export let data;
	console.log(data);
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
	<div class="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
		<p class="text-gray-300">This is where your project content goes.</p>
	</div>
</div>
