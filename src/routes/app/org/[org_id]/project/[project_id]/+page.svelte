<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/api.js';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import EnhancedCard from '$lib/ui/EnhancedCard.svelte';
	import SkeletonLoader from '$lib/ui/SkeletonLoader.svelte';

	export let data: any;

	let showDeleteModal = false;
	let promptToDelete: any = null;
	let searchTerm = '';
	let sortBy = 'name';
	let sortOrder = 'asc';
	let isLoading = false;
	let searchDebounceTimeout: any;

	// Reactive statement for filtered and sorted prompts
	$: filteredPrompts =
		data.project.prompts
			?.filter((prompt: any) => prompt.name.toLowerCase().includes(searchTerm.toLowerCase()))
			.sort((a: any, b: any) => {
				const aVal = a[sortBy]?.toLowerCase() || '';
				const bVal = b[sortBy]?.toLowerCase() || '';
				return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
			}) || [];

	// Debounced search to improve performance
	function handleSearch(event: Event) {
		const target = event.target as HTMLInputElement;
		clearTimeout(searchDebounceTimeout);
		searchDebounceTimeout = setTimeout(() => {
			searchTerm = target.value;
		}, 300);
	}

	function openDeleteModal(prompt: any) {
		promptToDelete = prompt;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		promptToDelete = null;
	}

	async function confirmDelete() {
		if (promptToDelete) {
			isLoading = true;
			try {
				const response = await api.deletePrompt(
					data.organization_id,
					data.project._id,
					promptToDelete._id
				);
				if (response) {
					await invalidateAll();
				}
			} catch (error) {
				console.error('Error deleting prompt:', error);
			} finally {
				isLoading = false;
			}
		}
		closeDeleteModal();
	}

	async function duplicatePrompt(prompt: any) {
		isLoading = true;
		try {
			// Implementation for duplicating prompt
			console.log('Duplicating prompt:', prompt.name);
			// Add your duplicate logic here
		} catch (error) {
			console.error('Error duplicating prompt:', error);
		} finally {
			isLoading = false;
		}
	}

	function toggleSort(field: string) {
		if (sortBy === field) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = field;
			sortOrder = 'asc';
		}
	}

	function formatDate(dateString: string) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getPromptStatus(prompt: any) {
		if (prompt.status === 'archived') return 'archived';
		if (prompt.status === 'draft') return 'draft';
		return 'active';
	}
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<!-- Loading indicator -->
	{#if isLoading}
		<div class="fixed right-4 top-4 z-40">
			<div
				class="flex items-center space-x-2 rounded-lg bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm dark:bg-gray-800/90"
			>
				<i class="fas fa-spinner animate-spin text-blue-500"></i>
				<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Processing...</span>
			</div>
		</div>
	{/if}

	<div class="mx-auto px-4 py-8 sm:px-6 lg:px-8">
		<!-- Enhanced Hero Section -->
		<div class="mb-8">
			<div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
				<div class="flex items-center space-x-4">
					<div
						class="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg"
					>
						<i class="fas fa-magic text-2xl text-white"></i>
					</div>
					<div>
						<h1 class="text-4xl font-bold text-gray-800 dark:text-gray-100">{data.project.name}</h1>
						<p class="text-lg text-gray-600 dark:text-gray-400">
							Manage your AI prompts, templates, and intelligent agents
						</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-3">
					<a
						href="/app/org/{data.organization_id}/project/{data.project._id}/agents"
						class="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						<i class="fas fa-robot"></i>
						<span>AI Agents</span>
					</a>
					<a
						href="/app/org/{data.organization_id}/project/{data.project._id}/config"
						class="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						<i class="fas fa-cog"></i>
						<span>Settings</span>
					</a>
					<a
						href="/app/org/{data.organization_id}/project/{data.project._id}/add"
						class="flex items-center space-x-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-indigo-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
					>
						<i class="fas fa-plus"></i>
						<span>New Prompt</span>
					</a>
				</div>
			</div>

			<!-- Enhanced Breadcrumb -->
			<nav class="mt-6 flex items-center space-x-2 text-sm">
				<a
					href="/app/org/{data.organization_id}"
					class="flex items-center space-x-1 text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
				>
					<i class="fas fa-home text-xs"></i>
					<span>Projects</span>
				</a>
				<i class="fas fa-chevron-right text-xs text-gray-400"></i>
				<span class="font-medium text-gray-800 dark:text-gray-200">{data.project.name}</span>
			</nav>
		</div>

		<!-- Enhanced Navigation Tabs -->
		<div class="mb-8">
			<div class="border-b border-gray-200/50 dark:border-gray-700/50">
				<nav class="-mb-px flex space-x-8">
					<a
						href="/app/org/{data.organization_id}/project/{data.project._id}"
						class="group flex items-center space-x-2 border-b-2 border-blue-500 px-1 py-4 font-medium text-blue-600 dark:text-blue-400"
					>
						<div
							class="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10 transition-colors group-hover:bg-blue-500/20"
						>
							<i class="fas fa-magic text-sm"></i>
						</div>
						<span>Prompts</span>
					</a>
					<a
						href="/app/org/{data.organization_id}/project/{data.project._id}/agents"
						class="group flex items-center space-x-2 border-b-2 border-transparent px-1 py-4 font-medium text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
					>
						<div
							class="flex h-6 w-6 items-center justify-center rounded bg-gray-500/10 transition-colors group-hover:bg-gray-500/20"
						>
							<i class="fas fa-robot text-sm"></i>
						</div>
						<span>AI Agents</span>
					</a>
				</nav>
			</div>
		</div>

		<!-- Statistics Cards -->
		<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
			<div
				class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-blue-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
			>
				<div class="absolute left-0 top-0 h-1 w-full bg-blue-500"></div>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Prompts</p>
						<p
							class="text-3xl font-bold text-gray-800 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400"
						>
							{data.project.prompts?.length || 0}
						</p>
					</div>
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 shadow-lg">
						<i class="fas fa-file-alt text-white"></i>
					</div>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-green-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-600"
			>
				<div class="absolute left-0 top-0 h-1 w-full bg-green-500"></div>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
						<p
							class="text-3xl font-bold text-gray-800 transition-colors group-hover:text-green-600 dark:text-gray-100 dark:group-hover:text-green-400"
						>
							{data.project.prompts?.filter((p: any) => p.status !== 'archived').length || 0}
						</p>
					</div>
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500 shadow-lg">
						<i class="fas fa-check-circle text-white"></i>
					</div>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-purple-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-600"
			>
				<div class="absolute left-0 top-0 h-1 w-full bg-purple-500"></div>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</p>
						<p
							class="text-sm font-semibold text-gray-800 transition-colors group-hover:text-purple-600 dark:text-gray-100 dark:group-hover:text-purple-400"
						>
							{formatDate(data.project.updatedAt)}
						</p>
					</div>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500 shadow-lg"
					>
						<i class="fas fa-clock text-white"></i>
					</div>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-orange-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-orange-600"
			>
				<div class="absolute left-0 top-0 h-1 w-full bg-orange-500"></div>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Project Type</p>
						<p
							class="text-sm font-semibold text-gray-800 transition-colors group-hover:text-orange-600 dark:text-gray-100 dark:group-hover:text-orange-400"
						>
							{data.project.type || 'General'}
						</p>
					</div>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500 shadow-lg"
					>
						<i class="fas fa-tag text-white"></i>
					</div>
				</div>
			</div>
		</div>

		<!-- Prompts Section -->
		<div
			class="rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
		>
			<!-- Header -->
			<div class="border-b border-gray-200 p-6 dark:border-gray-700">
				<div
					class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
				>
					<div>
						<h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Prompt Library</h2>
						<p class="text-gray-600 dark:text-gray-400">
							Create, manage, and organize your AI prompts and templates
						</p>
					</div>

					<!-- Search and Actions -->
					<div class="flex items-center space-x-3">
						<div class="relative">
							<i
								class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
							></i>
							<input
								type="text"
								placeholder="Search prompts..."
								on:input={handleSearch}
								class="w-64 rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-gray-900 placeholder-gray-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-blue-400"
							/>
						</div>

						<!-- Sort Controls -->
						<div class="flex items-center space-x-2">
							<button
								on:click={() => toggleSort('name')}
								class="flex items-center space-x-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
							>
								<i
									class="fas fa-sort-alpha-{sortBy === 'name' && sortOrder === 'asc'
										? 'down'
										: 'up'}"
								></i>
								<span>Name</span>
							</button>
							<button
								on:click={() => toggleSort('updatedAt')}
								class="flex items-center space-x-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
							>
								<i
									class="fas fa-sort-numeric-{sortBy === 'updatedAt' && sortOrder === 'asc'
										? 'down'
										: 'up'}"
								></i>
								<span>Date</span>
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="p-6">
				{#if isLoading}
					<!-- Skeleton Loading State -->
					<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
						<SkeletonLoader variant="card" count={6} />
					</div>
				{:else if filteredPrompts.length === 0}
					<!-- Empty State -->
					<div class="py-16 text-center">
						<div
							class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20"
						>
							<i class="fas fa-magic text-3xl text-indigo-600 dark:text-indigo-400"></i>
						</div>
						<h3 class="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
							{searchTerm ? 'No prompts found' : 'No prompts yet'}
						</h3>
						<p class="mx-auto mb-8 max-w-md text-gray-600 dark:text-gray-400">
							{searchTerm
								? `No prompts match "${searchTerm}". Try adjusting your search or create a new prompt.`
								: 'Get started by creating your first AI prompt template to unlock the power of intelligent automation.'}
						</p>
						{#if !searchTerm}
							<a
								href="/app/org/{data.organization_id}/project/{data.project._id}/add"
								class="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-indigo-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
							>
								<i class="fas fa-plus"></i>
								<span>Create Your First Prompt</span>
							</a>
						{:else}
							<button
								on:click={() => (searchTerm = '')}
								class="inline-flex items-center space-x-2 rounded-lg border-2 border-gray-300 px-6 py-3 font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-700"
							>
								<i class="fas fa-times"></i>
								<span>Clear Search</span>
							</button>
						{/if}
					</div>
				{:else}
					<!-- Enhanced Prompts Grid -->
					<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
						{#each filteredPrompts as prompt}
							<EnhancedCard
								title={prompt.name}
								description={prompt.description || 'No description provided'}
								status={getPromptStatus(prompt)}
								type="prompt"
								updatedAt={prompt.updatedAt || prompt.createdAt}
								version={prompt.version}
								href="/app/org/{data.organization_id}/project/{data.project
									._id}/prompt/{prompt._id}"
								onDelete={() => openDeleteModal(prompt)}
								onDuplicate={() => duplicatePrompt(prompt)}
							/>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Enhanced Delete Confirmation Modal -->
{#if showDeleteModal && promptToDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
		<div
			class="mx-auto w-full max-w-md transform overflow-hidden rounded-2xl border border-gray-200/50 bg-white/95 shadow-2xl backdrop-blur-lg transition-all dark:border-gray-700/50 dark:bg-gray-800/95"
		>
			<!-- Header -->
			<div class="p-6 pb-4">
				<div class="flex items-center space-x-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 shadow-lg">
						<i class="fas fa-exclamation-triangle text-white"></i>
					</div>
					<div>
						<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Prompt</h3>
						<p class="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="px-6 pb-6">
				<div class="rounded-lg bg-red-50/50 p-4 dark:bg-red-900/20">
					<p class="text-gray-700 dark:text-gray-300">
						Are you sure you want to delete the prompt
						<span class="font-semibold text-red-600 dark:text-red-400">"{promptToDelete.name}"</span
						>?
					</p>
					<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
						All associated data will be permanently removed from your project.
					</p>
				</div>
			</div>

			<!-- Actions -->
			<div
				class="flex items-center justify-end space-x-3 bg-gray-50/50 px-6 py-4 dark:bg-gray-700/30"
			>
				<button
					on:click={closeDeleteModal}
					disabled={isLoading}
					class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500/20 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
				>
					Cancel
				</button>
				<button
					on:click={confirmDelete}
					disabled={isLoading}
					class="flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white shadow-lg transition-all hover:bg-red-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
				>
					{#if isLoading}
						<i class="fas fa-spinner animate-spin"></i>
						<span>Deleting...</span>
					{:else}
						<i class="fas fa-trash"></i>
						<span>Delete Prompt</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
