<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/api.js';
	import { onMount } from 'svelte';

	export let data;

	let showDeleteModal = false;
	let promptToDelete = null;
	let searchTerm = '';
	let sortBy = 'name';
	let sortOrder = 'asc';

	$: filteredPrompts =
		data.project.prompts
			?.filter((prompt) => prompt.name.toLowerCase().includes(searchTerm.toLowerCase()))
			.sort((a, b) => {
				const aVal = a[sortBy]?.toLowerCase() || '';
				const bVal = b[sortBy]?.toLowerCase() || '';
				return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
			}) || [];

	function openDeleteModal(prompt) {
		promptToDelete = prompt;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		promptToDelete = null;
	}

	async function confirmDelete() {
		if (promptToDelete) {
			const response = await api.deletePrompt(
				data.organization_id,
				data.project._id,
				promptToDelete._id
			);
			if (response) {
				invalidateAll();
			}
		}
		closeDeleteModal();
	}

	function toggleSort(field) {
		if (sortBy === field) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = field;
			sortOrder = 'asc';
		}
	}

	function formatDate(dateString) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="min-h-screen">
	<!-- Hero Section -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600"
				>
					<i class="fas fa-magic text-xl text-white"></i>
				</div>
				<div>
					<h1 class="text-3xl font-bold text-gray-100">{data.project.name}</h1>
					<p class="text-gray-400">Manage your AI prompts, templates, and intelligent agents</p>
				</div>
			</div>
			<div class="flex space-x-3">
				<a
					href="/app/org/{data.organization_id}/project/{data.project._id}/agents"
					class="flex items-center space-x-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-300 transition-all hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
				>
					<i class="fas fa-robot"></i>
					<span>AI Agents</span>
				</a>
				<a
					href="/app/org/{data.organization_id}/project/{data.project._id}/config"
					class="flex items-center space-x-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-300 transition-all hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<i class="fas fa-cog"></i>
					<span>Settings</span>
				</a>
				<a
					href="/app/org/{data.organization_id}/project/{data.project._id}/add"
					class="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-white transition-all hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<i class="fas fa-plus"></i>
					<span>New Prompt</span>
				</a>
			</div>
		</div>

		<!-- Breadcrumb -->
		<nav class="mt-4 flex items-center space-x-2 text-sm text-gray-400">
			<a href="/app/org/{data.organization_id}" class="hover:text-gray-300">Projects</a>
			<i class="fas fa-chevron-right text-xs"></i>
			<span class="text-gray-200">{data.project.name}</span>
		</nav>
	</div>

	<!-- Navigation Tabs -->
	<div class="mb-8">
		<div class="border-b border-gray-800">
			<nav class="-mb-px flex space-x-8">
				<a
					href="/app/org/{data.organization_id}/project/{data.project._id}"
					class="flex items-center space-x-2 border-b-2 border-blue-500 px-1 py-4 text-sm font-medium text-blue-400"
				>
					<i class="fas fa-magic"></i>
					<span>Prompts</span>
				</a>
				<a
					href="/app/org/{data.organization_id}/project/{data.project._id}/agents"
					class="flex items-center space-x-2 border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-400 hover:border-gray-600 hover:text-gray-300"
				>
					<i class="fas fa-robot"></i>
					<span>AI Agents</span>
				</a>
			</nav>
		</div>
	</div>

	<!-- Statistics Cards -->
	<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-400">Total Prompts</p>
					<p class="text-2xl font-bold text-gray-100">{data.project.prompts?.length || 0}</p>
				</div>
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
					<i class="fas fa-file-alt text-blue-400"></i>
				</div>
			</div>
		</div>
		<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-400">Active</p>
					<p class="text-2xl font-bold text-green-400">
						{data.project.prompts?.filter((p) => p.status !== 'archived').length || 0}
					</p>
				</div>
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
					<i class="fas fa-check-circle text-green-400"></i>
				</div>
			</div>
		</div>
		<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-400">Last Updated</p>
					<p class="text-sm font-medium text-gray-200">{formatDate(data.project.updatedAt)}</p>
				</div>
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
					<i class="fas fa-clock text-purple-400"></i>
				</div>
			</div>
		</div>
		<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-400">Project Type</p>
					<p class="text-sm font-medium text-gray-200">{data.project.type || 'General'}</p>
				</div>
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
					<i class="fas fa-tag text-orange-400"></i>
				</div>
			</div>
		</div>
	</div>

	<!-- Prompts Section -->
	<div class="rounded-xl border border-gray-800 bg-gray-900">
		<!-- Header -->
		<div class="border-b border-gray-800 p-6">
			<div
				class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
			>
				<div>
					<h2 class="text-xl font-semibold text-gray-100">Prompt Library</h2>
					<p class="text-sm text-gray-400">Create, manage, and organize your AI prompts</p>
				</div>

				<!-- Search and Filter -->
				<div class="flex items-center space-x-3">
					<div class="relative">
						<i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
						<input
							type="text"
							placeholder="Search prompts..."
							bind:value={searchTerm}
							class="w-64 rounded-lg border border-gray-700 bg-gray-800 py-2 pl-10 pr-4 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Content -->
		<div class="p-6">
			{#if filteredPrompts.length === 0}
				<!-- Empty State -->
				<div class="py-16 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800"
					>
						<i class="fas fa-magic text-2xl text-gray-400"></i>
					</div>
					<h3 class="mb-2 text-lg font-medium text-gray-300">
						{searchTerm ? 'No prompts found' : 'No prompts yet'}
					</h3>
					<p class="mb-6 text-gray-400">
						{searchTerm
							? `No prompts match "${searchTerm}". Try adjusting your search.`
							: 'Get started by creating your first AI prompt template.'}
					</p>
					{#if !searchTerm}
						<a
							href="/app/org/{data.organization_id}/project/{data.project._id}/add"
							class="inline-flex items-center space-x-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white transition-all hover:from-blue-700 hover:to-purple-700"
						>
							<i class="fas fa-plus"></i>
							<span>Create Your First Prompt</span>
						</a>
					{/if}
				</div>
			{:else}
				<!-- Prompts Grid -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
					{#each filteredPrompts as prompt}
						<div
							class="group relative rounded-lg border border-gray-700 bg-gray-800 p-6 transition-all hover:border-gray-600 hover:shadow-lg"
						>
							<!-- Status Badge -->
							<div class="absolute right-4 top-4">
								<span
									class="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400"
								>
									<span class="mr-1 h-1.5 w-1.5 rounded-full bg-green-400"></span>
									Active
								</span>
							</div>

							<!-- Content -->
							<div class="mb-4">
								<h3 class="mb-2 text-lg font-semibold text-gray-100 group-hover:text-white">
									{prompt.name}
								</h3>
								<p class="line-clamp-2 text-sm text-gray-400">
									{prompt.description || 'No description provided'}
								</p>
							</div>

							<!-- Meta Info -->
							<div class="mb-4 flex items-center space-x-4 text-xs text-gray-500">
								<span class="flex items-center">
									<i class="fas fa-calendar mr-1"></i>
									{formatDate(prompt.updatedAt || prompt.createdAt)}
								</span>
								{#if prompt.version}
									<span class="flex items-center">
										<i class="fas fa-code-branch mr-1"></i>
										v{prompt.version}
									</span>
								{/if}
							</div>

							<!-- Actions -->
							<div class="flex items-center justify-between">
								<a
									href="/app/org/{data.organization_id}/project/{data.project
										._id}/prompt/{prompt._id}"
									class="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<i class="fas fa-external-link-alt"></i>
									<span>Open</span>
								</a>

								<div class="flex items-center space-x-2">
									<button
										class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-300"
										title="Duplicate"
									>
										<i class="fas fa-copy"></i>
									</button>
									<button
										on:click={() => openDeleteModal(prompt)}
										class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-600/10 hover:text-red-400"
										title="Delete"
									>
										<i class="fas fa-trash"></i>
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && promptToDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="mx-4 w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
			<div class="mb-4 flex items-center space-x-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
					<i class="fas fa-exclamation-triangle text-red-400"></i>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-gray-100">Delete Prompt</h3>
					<p class="text-sm text-gray-400">This action cannot be undone</p>
				</div>
			</div>

			<p class="mb-6 text-gray-300">
				Are you sure you want to delete <strong class="text-white">"{promptToDelete.name}"</strong>?
			</p>

			<div class="flex justify-end space-x-3">
				<button
					on:click={closeDeleteModal}
					class="rounded-lg border border-gray-700 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>
					Cancel
				</button>
				<button
					on:click={confirmDelete}
					class="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
				>
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}
