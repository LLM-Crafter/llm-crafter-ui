<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/api.js';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import CreateAgentModal from '$lib/ui/modal/CreateAgentModal.svelte';
	import EditAgentModal from '$lib/ui/modal/EditAgentModal.svelte';
	import ChatAgentModal from '$lib/ui/modal/ChatAgentModal.svelte';
	import ExecuteAgentModal from '$lib/ui/modal/ExecuteAgentModal.svelte';

	export let data;

	let showCreateModal = false;
	let showEditModal = false;
	let showDeleteModal = false;
	let showChatModal = false;
	let showExecuteModal = false;
	let selectedAgent = null;
	let agentToDelete = null;
	let chatAgent = null;
	let executeAgent = null;
	let searchTerm = '';
	let filterType = 'all';
	let agents = [];
	let loading = true;

	$: filteredAgents = agents
		.filter((agent) => {
			const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesType = filterType === 'all' || agent.type === filterType;
			return matchesSearch && matchesType;
		})
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

	function openEditModal(agent) {
		selectedAgent = agent;
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		selectedAgent = null;
	}

	function openChatModal(agent) {
		chatAgent = agent;
		showChatModal = true;
	}

	function closeChatModal() {
		showChatModal = false;
		chatAgent = null;
	}

	function openExecuteModal(agent) {
		executeAgent = agent;
		showExecuteModal = true;
	}

	function closeExecuteModal() {
		showExecuteModal = false;
		executeAgent = null;
	}

	function openDeleteModal(agent) {
		agentToDelete = agent;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		agentToDelete = null;
	}

	function getToolIcon(toolId) {
		switch (toolId) {
			case 'web_search':
				return 'fas fa-search';
			case 'calculator':
				return 'fas fa-calculator';
			case 'llm_prompt':
				return 'fas fa-brain';
			case 'current_time':
				return 'fas fa-clock';
			case 'json_processor':
				return 'fas fa-code';
			case 'api_caller':
				return 'fas fa-plug';
			default:
				return 'fas fa-tools';
		}
	}

	function getToolColor(toolId) {
		switch (toolId) {
			case 'web_search':
				return 'text-blue-400 bg-blue-500/10';
			case 'calculator':
				return 'text-green-400 bg-green-500/10';
			case 'llm_prompt':
				return 'text-purple-400 bg-purple-500/10';
			case 'current_time':
				return 'text-yellow-400 bg-yellow-500/10';
			case 'json_processor':
				return 'text-gray-400 bg-gray-500/10';
			case 'api_caller':
				return 'text-red-400 bg-red-500/10';
			default:
				return 'text-indigo-400 bg-indigo-500/10';
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
			}
		}
		closeDeleteModal();
	}

	function formatDate(dateString) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getAgentTypeIcon(type) {
		switch (type) {
			case 'chatbot':
				return 'fas fa-comments';
			case 'task':
				return 'fas fa-tasks';
			case 'workflow':
				return 'fas fa-sitemap';
			case 'api':
				return 'fas fa-code';
			default:
				return 'fas fa-robot';
		}
	}

	function getAgentTypeColor(type) {
		switch (type) {
			case 'chatbot':
				return 'from-blue-500 to-cyan-500';
			case 'task':
				return 'from-green-500 to-emerald-500';
			case 'workflow':
				return 'from-purple-500 to-pink-500';
			case 'api':
				return 'from-orange-500 to-red-500';
			default:
				return 'from-gray-500 to-gray-600';
		}
	}
</script>

<div class="min-h-screen">
	<!-- Hero Section -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600"
				>
					<i class="fas fa-robot text-xl text-white"></i>
				</div>
				<div>
					<h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">AI Agents</h1>
					<p class="text-gray-600 dark:text-gray-400">
						Manage intelligent agents for {data.project.name}
					</p>
				</div>
			</div>
			<div class="flex space-x-3">
				<button
					on:click={openCreateModal}
					class="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-white transition-all hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
				>
					<i class="fas fa-plus"></i>
					<span>Create Agent</span>
				</button>
			</div>
		</div>

		<!-- Breadcrumb -->
		<nav class="mt-4 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
			<a href="/app/org/{data.organization_id}" class="hover:text-gray-700 dark:hover:text-gray-300"
				>Projects</a
			>
			<i class="fas fa-chevron-right text-xs"></i>
			<a
				href="/app/org/{data.organization_id}/project/{data.project._id}"
				class="hover:text-gray-700 dark:hover:text-gray-300">{data.project.name}</a
			>
			<i class="fas fa-chevron-right text-xs"></i>
			<span class="text-gray-800 dark:text-gray-200">Agents</span>
		</nav>
	</div>

	<!-- Navigation Tabs -->
	<div class="mb-8">
		<div class="border-b border-gray-200 dark:border-gray-700">
			<nav class="-mb-px flex space-x-8">
				<a
					href="/app/org/{data.organization_id}/project/{data.project._id}"
					class="flex items-center space-x-2 border-b-2 border-transparent px-1 py-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
				>
					<i class="fas fa-magic"></i>
					<span>Prompts</span>
				</a>
				<a
					href="/app/org/{data.organization_id}/project/{data.project._id}/agents"
					class="flex items-center space-x-2 border-b-2 border-indigo-500 px-1 py-4 text-sm font-medium text-indigo-600 dark:text-indigo-400"
				>
					<i class="fas fa-robot"></i>
					<span>AI Agents</span>
				</a>
			</nav>
		</div>
	</div>

	<!-- Statistics Cards -->
	<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		<div
			class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Agents</p>
					<p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{agents.length}</p>
				</div>
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
					<i class="fas fa-robot text-indigo-600 dark:text-indigo-400"></i>
				</div>
			</div>
		</div>
		<div
			class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Agents</p>
					<p class="text-2xl font-bold text-green-600 dark:text-green-400">
						{agents.filter((a) => a.is_active).length}
					</p>
				</div>
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
					<i class="fas fa-check-circle text-green-600 dark:text-green-400"></i>
				</div>
			</div>
		</div>
		<div
			class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Chatbots</p>
					<p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
						{agents.filter((a) => a.type === 'chatbot').length}
					</p>
				</div>
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
					<i class="fas fa-comments text-blue-600 dark:text-blue-400"></i>
				</div>
			</div>
		</div>
		<div
			class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Task Agents</p>
					<p class="text-2xl font-bold text-green-600 dark:text-green-400">
						{agents.filter((a) => a.type === 'task').length}
					</p>
				</div>
				<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
					<i class="fas fa-tasks text-green-600 dark:text-green-400"></i>
				</div>
			</div>
		</div>
	</div>

	<!-- Agents Section -->
	<div class="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
		<!-- Header -->
		<div class="border-b border-gray-200 p-6 dark:border-gray-700">
			<div
				class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
			>
				<div>
					<h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Agent Management</h2>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Create and manage intelligent AI agents
					</p>
				</div>

				<!-- Search and Filter -->
				<div class="flex items-center space-x-3">
					<div class="relative">
						<i
							class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
						></i>
						<input
							type="text"
							placeholder="Search agents..."
							bind:value={searchTerm}
							class="w-64 rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
						/>
					</div>
					<select
						bind:value={filterType}
						class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
					>
						<option value="all">All Types</option>
						<option value="chatbot">Chatbots</option>
						<option value="task">Task Agents</option>
						<option value="workflow">Workflows</option>
						<option value="api">API Agents</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Content -->
		<div class="p-6">
			{#if loading}
				<!-- Loading State -->
				<div class="py-16 text-center">
					<div
						class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
					></div>
					<p class="text-gray-600 dark:text-gray-400">Loading agents...</p>
				</div>
			{:else if filteredAgents.length === 0}
				<!-- Empty State -->
				<div class="py-16 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
					>
						<i class="fas fa-robot text-2xl text-gray-400 dark:text-gray-500"></i>
					</div>
					<h3 class="mb-2 text-lg font-medium text-gray-800 dark:text-gray-200">
						{searchTerm || filterType !== 'all' ? 'No agents found' : 'No agents yet'}
					</h3>
					<p class="mb-6 text-gray-600 dark:text-gray-400">
						{searchTerm || filterType !== 'all'
							? 'Try adjusting your search or filter criteria.'
							: 'Get started by creating your first AI agent.'}
					</p>
					{#if !searchTerm && filterType === 'all'}
						<button
							on:click={openCreateModal}
							class="inline-flex items-center space-x-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-white transition-all hover:from-indigo-700 hover:to-purple-700"
						>
							<i class="fas fa-plus"></i>
							<span>Create Your First Agent</span>
						</button>
					{/if}
				</div>
			{:else}
				<!-- Agents Grid -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
					{#each filteredAgents as agent}
						<div
							class="group relative rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-gray-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
						>
							<!-- Status and Type -->
							<div class="absolute right-4 top-4 flex items-center space-x-2">
								<span
									class="inline-flex items-center rounded-full bg-gradient-to-r {getAgentTypeColor(
										agent.type
									)} px-2.5 py-0.5 text-xs font-medium text-white"
								>
									<i class="{getAgentTypeIcon(agent.type)} mr-1"></i>
									{agent.type}
								</span>
								{#if agent.is_active}
									<span
										class="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400"
									>
										<span class="mr-1 h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400"
										></span>
										Active
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400"
									>
										<span class="mr-1 h-1.5 w-1.5 rounded-full bg-gray-600 dark:bg-gray-400"></span>
										Inactive
									</span>
								{/if}
							</div>

							<!-- Content -->
							<div class="mb-4 mt-8">
								<a
									href="/app/org/{data.organization_id}/project/{data.project
										._id}/agents/{agent._id}"
									class="mb-2 block text-lg font-semibold text-gray-900 transition-colors hover:text-gray-700 dark:text-gray-100 dark:hover:text-white"
								>
									{agent.name}
								</a>
								<p class="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
									{agent.description || 'No description provided'}
								</p>
							</div>

							<!-- Model Info -->
							{#if agent.llm_settings?.model}
								<div class="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
									<div class="flex items-center justify-between text-sm">
										<span class="text-gray-600 dark:text-gray-400">Model:</span>
										<span class="font-medium text-gray-900 dark:text-gray-200"
											>{agent.llm_settings.model}</span
										>
									</div>
									{#if agent.llm_settings.parameters?.temperature}
										<div class="mt-1 flex items-center justify-between text-sm">
											<span class="text-gray-600 dark:text-gray-400">Temperature:</span>
											<span class="font-medium text-gray-900 dark:text-gray-200"
												>{agent.llm_settings.parameters.temperature}</span
											>
										</div>
									{/if}
								</div>
							{/if}

							<!-- Tools -->
							{#if agent.tools && agent.tools.length > 0}
								<div class="mb-4">
									<div class="flex flex-wrap gap-1">
										{#each agent.tools.slice(0, 3).map((tool) => tool.name) as tool}
											<span
												class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium {getToolColor(
													tool
												)}"
											>
												<i class="{getToolIcon(tool)} mr-1"></i>
												{tool}
											</span>
										{/each}
										{#if agent.tools.length > 3}
											<span
												class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-500/10 dark:text-gray-400"
											>
												+{agent.tools.length - 3} more
											</span>
										{/if}
									</div>
								</div>
							{/if}

							<!-- Meta Info -->
							<div
								class="mb-4 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400"
							>
								<span class="flex items-center">
									<i class="fas fa-calendar mr-1"></i>
									{formatDate(agent.updatedAt || agent.createdAt)}
								</span>
								{#if agent.conversations_count}
									<span class="flex items-center">
										<i class="fas fa-comments mr-1"></i>
										{agent.conversations_count} chats
									</span>
								{/if}
								{#if agent.executions_count}
									<span class="flex items-center">
										<i class="fas fa-play mr-1"></i>
										{agent.executions_count} runs
									</span>
								{/if}
							</div>

							<!-- Actions -->
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-2">
									{#if agent.type === 'chatbot'}
										<button
											on:click={() => openChatModal(agent)}
											class="flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
										>
											<i class="fas fa-comments"></i>
											<span>Chat</span>
										</button>
									{:else}
										<button
											on:click={() => openExecuteModal(agent)}
											class="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
										>
											<i class="fas fa-play"></i>
											<span>Execute</span>
										</button>
									{/if}
								</div>

								<div class="flex items-center space-x-2">
									<button
										on:click={() => openEditModal(agent)}
										class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
										title="Edit Agent"
									>
										<i class="fas fa-edit"></i>
									</button>
									<button
										class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
										title="Duplicate"
									>
										<i class="fas fa-copy"></i>
									</button>
									<button
										on:click={() => openDeleteModal(agent)}
										class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-600/10 dark:hover:text-red-400"
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

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && agentToDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div
			class="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
		>
			<div class="mb-4 flex items-center space-x-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
					<i class="fas fa-exclamation-triangle text-red-500 dark:text-red-400"></i>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Agent</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
				</div>
			</div>

			<p class="mb-6 text-gray-700 dark:text-gray-300">
				Are you sure you want to delete <strong class="text-gray-900 dark:text-white"
					>"{agentToDelete.name}"</strong
				>? This will also delete all associated conversations and execution history.
			</p>

			<div class="flex justify-end space-x-3">
				<button
					on:click={closeDeleteModal}
					class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					Cancel
				</button>
				<button
					on:click={confirmDelete}
					class="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
				>
					Delete Agent
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
