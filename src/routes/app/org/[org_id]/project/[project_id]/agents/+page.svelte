<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/api.js';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import EnhancedCard from '$lib/ui/EnhancedCard.svelte';
	import SkeletonLoader from '$lib/ui/SkeletonLoader.svelte';
	import CreateAgentModal from '$lib/ui/modal/CreateAgentModal.svelte';
	import EditAgentModal from '$lib/ui/modal/EditAgentModal.svelte';
	import ChatAgentModal from '$lib/ui/modal/ChatAgentModal.svelte';
	import ExecuteAgentModal from '$lib/ui/modal/ExecuteAgentModal.svelte';

	export let data: any;

	let showCreateModal = false;
	let showEditModal = false;
	let showDeleteModal = false;
	let showChatModal = false;
	let showExecuteModal = false;
	let selectedAgent: any = null;
	let agentToDelete: any = null;
	let chatAgent: any = null;
	let executeAgent: any = null;
	let searchTerm = '';
	let filterType = 'all';
	let sortBy = 'name';
	let sortOrder = 'asc';
	let agents: any[] = [];
	let loading = true;
	let isLoading = false;
	let searchDebounceTimeout: any;

	$: filteredAgents = agents
		.filter((agent: any) => {
			const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesType = filterType === 'all' || agent.type === filterType;
			return matchesSearch && matchesType;
		})
		.sort((a: any, b: any) => {
			const aVal = a[sortBy]?.toLowerCase() || '';
			const bVal = b[sortBy]?.toLowerCase() || '';
			return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
		});

	// Debounced search to improve performance
	function handleSearch(event: Event) {
		const target = event.target as HTMLInputElement;
		clearTimeout(searchDebounceTimeout);
		searchDebounceTimeout = setTimeout(() => {
			searchTerm = target.value;
		}, 300);
	}

	onMount(async () => {
		await loadAgents();
	});

	async function loadAgents() {
		try {
			loading = true;
			const response = await api.fetch(
				`/organizations/${data.organization_id}/projects/${data.project._id}/agents`
			);
			if (response.ok) {
				agents = await response.json();
			}
		} catch (error) {
			console.error('Failed to load agents:', error);
		} finally {
			loading = false;
		}
	}

	function openCreateModal() {
		showCreateModal = true;
	}

	function closeCreateModal() {
		showCreateModal = false;
	}

	function openEditModal(agent: any) {
		selectedAgent = agent;
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		selectedAgent = null;
	}

	function openChatModal(agent: any) {
		chatAgent = agent;
		showChatModal = true;
	}

	function closeChatModal() {
		showChatModal = false;
		chatAgent = null;
	}

	function openExecuteModal(agent: any) {
		executeAgent = agent;
		showExecuteModal = true;
	}

	function closeExecuteModal() {
		showExecuteModal = false;
		executeAgent = null;
	}

	function openDeleteModal(agent: any) {
		agentToDelete = agent;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		agentToDelete = null;
	}

	function toggleSort(field: string) {
		if (sortBy === field) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = field;
			sortOrder = 'asc';
		}
	}

	async function handleAgentCreated() {
		await loadAgents();
		closeCreateModal();
	}

	async function handleAgentUpdated() {
		await loadAgents();
		closeEditModal();
	}

	async function confirmDelete() {
		if (agentToDelete) {
			isLoading = true;
			try {
				const response = await api.fetch(
					`/organizations/${data.organization_id}/projects/${data.project._id}/agents/${agentToDelete._id}`,
					{
						method: 'DELETE'
					}
				);
				if (response.ok) {
					await loadAgents();
				}
			} catch (error) {
				console.error('Failed to delete agent:', error);
			} finally {
				isLoading = false;
			}
		}
		closeDeleteModal();
	}

	async function duplicateAgent(agent: any) {
		isLoading = true;
		try {
			// Implementation for duplicating agent
			console.log('Duplicating agent:', agent.name);
			// Add your duplicate logic here
		} catch (error) {
			console.error('Error duplicating agent:', error);
		} finally {
			isLoading = false;
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

	function getAgentStatus(agent: any): 'active' | 'inactive' {
		return agent.is_active ? 'active' : 'inactive';
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
						<i class="fas fa-robot text-2xl text-white"></i>
					</div>
					<div>
						<h1 class="text-4xl font-bold text-gray-800 dark:text-gray-100">AI Agents</h1>
						<p class="text-lg text-gray-600 dark:text-gray-400">
							Manage intelligent agents for automated tasks and conversations
						</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-3">
					<a
						href="/app/org/{data.organization_id}/project/{data.project._id}"
						class="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						<i class="fas fa-magic"></i>
						<span>Prompts</span>
					</a>
					<a
						href="/app/org/{data.organization_id}/project/{data.project._id}/config"
						class="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						<i class="fas fa-cog"></i>
						<span>Settings</span>
					</a>
					<button
						on:click={openCreateModal}
						class="flex items-center space-x-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-indigo-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
					>
						<i class="fas fa-plus"></i>
						<span>New Agent</span>
					</button>
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
				<a
					href="/app/org/{data.organization_id}/project/{data.project._id}"
					class="text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
				>
					{data.project.name}
				</a>
				<i class="fas fa-chevron-right text-xs text-gray-400"></i>
				<span class="font-medium text-gray-800 dark:text-gray-200">AI Agents</span>
			</nav>
		</div>

		<!-- Enhanced Navigation Tabs -->
		<div class="mb-8">
			<div class="border-b border-gray-200/50 dark:border-gray-700/50">
				<nav class="-mb-px flex space-x-8">
					<a
						href="/app/org/{data.organization_id}/project/{data.project._id}"
						class="group flex items-center space-x-2 border-b-2 border-transparent px-1 py-4 font-medium text-gray-500 transition-all hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
					>
						<div
							class="flex h-6 w-6 items-center justify-center rounded bg-gray-500/10 transition-colors group-hover:bg-gray-500/20"
						>
							<i class="fas fa-magic text-sm"></i>
						</div>
						<span>Prompts</span>
					</a>
					<a
						href="/app/org/{data.organization_id}/project/{data.project._id}/agents"
						class="group flex items-center space-x-2 border-b-2 border-indigo-500 px-1 py-4 font-medium text-indigo-600 dark:text-indigo-400"
					>
						<div
							class="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/10 transition-colors group-hover:bg-indigo-500/20"
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
				class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-indigo-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600"
			>
				<div class="absolute left-0 top-0 h-1 w-full bg-indigo-500"></div>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Agents</p>
						<p
							class="text-3xl font-bold text-gray-800 transition-colors group-hover:text-indigo-600 dark:text-gray-100 dark:group-hover:text-indigo-400"
						>
							{agents.length}
						</p>
					</div>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500 shadow-lg"
					>
						<i class="fas fa-robot text-white"></i>
					</div>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-green-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-600"
			>
				<div class="absolute left-0 top-0 h-1 w-full bg-green-500"></div>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Agents</p>
						<p
							class="text-3xl font-bold text-gray-800 transition-colors group-hover:text-green-600 dark:text-gray-100 dark:group-hover:text-green-400"
						>
							{agents.filter((a: any) => a.is_active).length}
						</p>
					</div>
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500 shadow-lg">
						<i class="fas fa-check-circle text-white"></i>
					</div>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-blue-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
			>
				<div class="absolute left-0 top-0 h-1 w-full bg-blue-500"></div>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Chatbots</p>
						<p
							class="text-3xl font-bold text-gray-800 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400"
						>
							{agents.filter((a: any) => a.type === 'chatbot').length}
						</p>
					</div>
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 shadow-lg">
						<i class="fas fa-comments text-white"></i>
					</div>
				</div>
			</div>

			<div
				class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-purple-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-600"
			>
				<div class="absolute left-0 top-0 h-1 w-full bg-purple-500"></div>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Task Agents</p>
						<p
							class="text-3xl font-bold text-gray-800 transition-colors group-hover:text-purple-600 dark:text-gray-100 dark:group-hover:text-purple-400"
						>
							{agents.filter((a: any) => a.type === 'task').length}
						</p>
					</div>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500 shadow-lg"
					>
						<i class="fas fa-tasks text-white"></i>
					</div>
				</div>
			</div>
		</div>

		<!-- Agents Section -->
		<div
			class="rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
		>
			<!-- Header -->
			<div class="border-b border-gray-200 p-6 dark:border-gray-700">
				<div
					class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
				>
					<div>
						<h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Agent Management</h2>
						<p class="text-gray-600 dark:text-gray-400">
							Create and manage intelligent AI agents for automation
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
								placeholder="Search agents..."
								on:input={handleSearch}
								class="w-64 rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-gray-900 placeholder-gray-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-indigo-400"
							/>
						</div>

						<!-- Sort and Filter Controls -->
						<div class="flex items-center space-x-2">
							<select
								bind:value={filterType}
								class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
							>
								<option value="all">All Types</option>
								<option value="chatbot">Chatbots</option>
								<option value="task">Task Agents</option>
								<option value="workflow">Workflows</option>
								<option value="api">API Agents</option>
							</select>
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
				{#if loading}
					<!-- Skeleton Loading State -->
					<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
						<SkeletonLoader variant="card" count={6} />
					</div>
				{:else if filteredAgents.length === 0}
					<!-- Empty State -->
					<div class="py-16 text-center">
						<div
							class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20"
						>
							<i class="fas fa-robot text-3xl text-indigo-600 dark:text-indigo-400"></i>
						</div>
						<h3 class="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
							{searchTerm || filterType !== 'all' ? 'No agents found' : 'No agents yet'}
						</h3>
						<p class="mx-auto mb-8 max-w-md text-gray-600 dark:text-gray-400">
							{searchTerm || filterType !== 'all'
								? 'Try adjusting your search or filter criteria.'
								: 'Get started by creating your first AI agent for automated tasks and conversations.'}
						</p>
						{#if !searchTerm && filterType === 'all'}
							<button
								on:click={openCreateModal}
								class="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-indigo-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
							>
								<i class="fas fa-plus"></i>
								<span>Create Your First Agent</span>
							</button>
						{:else}
							<button
								on:click={() => {
									searchTerm = '';
									filterType = 'all';
								}}
								class="inline-flex items-center space-x-2 rounded-lg border-2 border-gray-300 px-6 py-3 font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-700"
							>
								<i class="fas fa-times"></i>
								<span>Clear Filters</span>
							</button>
						{/if}
					</div>
				{:else}
					<!-- Enhanced Agents Grid -->
					<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
						{#each filteredAgents as agent}
							<EnhancedCard
								title={agent.name}
								description={agent.description || 'No description provided'}
								status={getAgentStatus(agent)}
								type={agent.type || 'agent'}
								updatedAt={agent.updatedAt || agent.createdAt}
								version=""
								href="/app/org/{data.organization_id}/project/{data.project._id}/agents/{agent._id}"
								onDelete={() => openDeleteModal(agent)}
								onDuplicate={() => duplicateAgent(agent)}
								customActions={agent.type === 'chatbot'
									? [
											{
												title: 'Chat',
												icon: 'fas fa-comments',
												onClick: () => openChatModal(agent)
											}
										]
									: [
											{
												title: 'Execute',
												icon: 'fas fa-play',
												onClick: () => openExecuteModal(agent)
											}
										]}
							/>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Create Agent Modal -->
{#if showCreateModal}
	<CreateAgentModal {data} on:created={handleAgentCreated} on:close={closeCreateModal} />
{/if}

<!-- Edit Agent Modal -->
{#if showEditModal && selectedAgent}
	<EditAgentModal
		{data}
		agent={selectedAgent}
		on:updated={handleAgentUpdated}
		on:close={closeEditModal}
	/>
{/if}

<!-- Enhanced Delete Confirmation Modal -->
{#if showDeleteModal && agentToDelete}
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
						<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Delete Agent</h3>
						<p class="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="px-6 pb-6">
				<div class="rounded-lg bg-red-50/50 p-4 dark:bg-red-900/20">
					<p class="text-gray-700 dark:text-gray-300">
						Are you sure you want to delete the agent
						<span class="font-semibold text-red-600 dark:text-red-400">"{agentToDelete.name}"</span
						>?
					</p>
					<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
						This will also delete all associated conversations and execution history.
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
						<span>Delete Agent</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Chat Agent Modal -->
{#if showChatModal && chatAgent}
	<ChatAgentModal {data} agent={chatAgent} on:close={closeChatModal} />
{/if}

<!-- Execute Agent Modal -->
{#if showExecuteModal && executeAgent}
	<ExecuteAgentModal {data} agent={executeAgent} on:close={closeExecuteModal} />
{/if}
