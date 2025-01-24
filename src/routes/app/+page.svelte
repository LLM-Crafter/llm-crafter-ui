<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { api } from '$lib/api';

	export let data;
	let createModalVisible = false;
	let orgName = '';
	let orgDescription = '';
	let selectedOrgId = '';

	async function handleCreateOrganization(event: Event) {
		event.preventDefault();
		try {
			const newOrg = await api.createOrganization({ name: orgName, description: orgDescription });
			data.organizations.push(newOrg);
			createModalVisible = false;
			invalidateAll();
		} catch (error) {
			console.error('Error creating organization:', error);
		}
	}

	function handleSelectOrganization(event: Event) {
		if (selectedOrgId) {
			goto(`/app/org/${selectedOrgId}`);
		}
	}
</script>

<div id="organization-screen" class="flex min-h-screen items-center justify-center bg-gray-950">
	<div class="w-96 rounded-lg border border-gray-800 bg-gray-900 p-8 shadow-lg">
		<div class="mb-6">
			<label for="organization" class="mb-1 block text-sm font-medium text-gray-300"
				>Choose an Organization</label
			>
			<select
				id="organization"
				bind:value={selectedOrgId}
				class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				{#each data.organizations as org}
					<option value={org._id}>{org.name}</option>
				{/each}
			</select>
		</div>
		<button
			id="select-org"
			on:click={handleSelectOrganization}
			class="mb-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>Select Organization</button
		>
		<p class="text-center text-gray-500">or</p>
		<button
			on:click={() => (createModalVisible = true)}
			id="create-org"
			class="mt-4 w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
			>Create New Organization</button
		>
	</div>
</div>

<div
	id="create-org-modal"
	class:hidden={!createModalVisible}
	class="fixed inset-0 flex items-center justify-center bg-gray-950 bg-opacity-75"
>
	<div class="w-96 rounded-lg border border-gray-800 bg-gray-900 p-8 shadow-lg">
		<h2 class="mb-6 text-2xl font-semibold text-gray-100">Create Organization</h2>
		<form id="create-org-form" on:submit={handleCreateOrganization}>
			<div class="mb-4">
				<label for="org-name" class="mb-1 block text-sm font-medium text-gray-300">Name</label>
				<input
					type="text"
					id="org-name"
					bind:value={orgName}
					placeholder="Enter organization name"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
			</div>
			<div class="mb-6">
				<label for="org-description" class="mb-1 block text-sm font-medium text-gray-300"
					>Description</label
				>
				<textarea
					id="org-description"
					placeholder="Enter organization description"
					bind:value={orgDescription}
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
					rows="3"
					required
				></textarea>
			</div>
			<div class="flex justify-end space-x-4">
				<button
					on:click={() => (createModalVisible = false)}
					type="button"
					id="close-create-org-modal"
					class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
					>Cancel</button
				>
				<button
					type="submit"
					class="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
					>Create</button
				>
			</div>
		</form>
	</div>
</div>
