<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api, type ApiKeyDTO } from '$lib/api.js';

	export let data;
	console.log(data);
	let formData: ApiKeyDTO = {};

	async function createApiKey() {
		const response = await api.createApiKey(data.organization_id, data.project._id, formData);
		if (response) {
			invalidateAll();
		}
	}

	async function deleteApiKey(api_key_id: string) {
		const response = await api.deleteApiKey(data.organization_id, data.project._id, api_key_id);
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
				href="/app/org/{data.organization_id}/project/{data.project._id}"
				class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>Exit Configuration
			</a>
			<a
				href="/app/org/{data.organization_id}"
				class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>Back to Projects</a
			>
		</div>
	</div>

	<!-- Project Content (Placeholder) -->
	<div id="configuration-modal" class="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
		<h2 class="mb-4 text-xl font-semibold text-gray-100">Project Configuration</h2>

		<!-- Existing API Keys -->
		<div id="api-keys-list" class="mb-6">
			<h3 class="mb-3 text-lg font-semibold text-gray-100">Existing API Keys</h3>
			<ul class="space-y-2">
				<!-- API Key Item Template -->
				<!-- Example API Key -->
				{#each data.project?.apiKeys as api_key}
					<li class="flex items-center justify-between rounded-lg bg-gray-800 p-3">
						<span class="text-gray-300">{api_key.provider.name} - {api_key.name}</span>
						<button
							class="text-red-500 hover:text-red-700 focus:outline-none"
							on:click={() => {
								deleteApiKey(api_key._id);
							}}>Delete</button
						>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Add New API Key -->
		<div id="api-key-form" class="space-y-4">
			<div>
				<label for="provider" class="mb-1 block text-gray-400">Select Provider</label>
				<select
					id="provider"
					bind:value={formData.provider}
					class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{#each data.providers as provider}
						<option value={provider._id}>{provider.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="api-key" class="mb-1 block text-gray-400">API Key</label>
				<input
					bind:value={formData.key}
					type="text"
					id="api-key"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Enter your API Key"
				/>
			</div>
			<div>
				<label for="api-key" class="mb-1 block text-gray-400">API Key Name</label>
				<input
					bind:value={formData.name}
					type="text"
					id="api-key-name"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Enter your API Key"
				/>
			</div>
			<button
				on:click={createApiKey}
				type="button"
				class="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>Add API Key</button
			>
		</div>
	</div>
</div>
