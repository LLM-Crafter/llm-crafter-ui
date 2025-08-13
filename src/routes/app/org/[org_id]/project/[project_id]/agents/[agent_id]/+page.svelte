<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api.js';
	import ChatAgentModal from '$lib/ui/modal/ChatAgentModal.svelte';
	import ExecuteAgentModal from '$lib/ui/modal/ExecuteAgentModal.svelte';
	import EditAgentModal from '$lib/ui/modal/EditAgentModal.svelte';
	import ConfigureApiEndpointsModal from '$lib/ui/modal/ConfigureApiEndpointsModal.svelte';

	export let data;

	let agent = null;
	let conversations = [];
	let executions = [];
	let loading = true;
	let showChatModal = false;
	let showExecuteModal = false;
	let showEditModal = false;
	let showApiConfigModal = false;

	onMount(async () => {
		await loadAgentData();
	});

	async function loadAgentData() {
		try {
			loading = true;

			// Load agent details
			const agentResponse = await api.fetch(
				`/organizations/${data.organization_id}/projects/${data.project._id}/agents/${data.agent_id}`
			);
			if (agentResponse.ok) {
				agent = await agentResponse.json();
			}

			// Load conversations for chatbots
			if (agent?.type === 'chatbot') {
				const conversationsResponse = await api.fetch(
					`/organizations/${data.organization_id}/projects/${data.project._id}/agents/${data.agent_id}/conversations`
				);
				if (conversationsResponse.ok) {
					conversations = await conversationsResponse.json();
				}
			}

			// Load executions for non-chatbots
			if (agent?.type !== 'chatbot') {
				const executionsResponse = await api.fetch(
					`/organizations/${data.organization_id}/projects/${data.project._id}/agents/${data.agent_id}/executions`
				);
				if (executionsResponse.ok) {
					executions = await executionsResponse.json();
				}
			}
		} catch (error) {
			console.error('Failed to load agent data:', error);
		} finally {
			loading = false;
		}
	}

	function getTypeIcon(type) {
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

	export function getTypeColor(type) {
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
				return 'text-blue-400 bg-blue-500/20';
			case 'calculator':
				return 'text-green-400 bg-green-500/20';
			case 'llm_prompt':
				return 'text-purple-400 bg-purple-500/20';
			case 'current_time':
				return 'text-yellow-400 bg-yellow-500/20';
			case 'json_processor':
				return 'text-gray-400 bg-gray-500/20';
			case 'api_caller':
				return 'text-red-400 bg-red-500/20';
			default:
				return 'text-indigo-400 bg-indigo-500/20';
		}
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function handleAgentUpdated() {
		await loadAgentData();
		showEditModal = false;
	}
</script>

{#if loading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
			></div>
			<p class="text-gray-400">Loading agent...</p>
		</div>
	</div>
{:else if !agent}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
				<i class="fas fa-exclamation-triangle text-2xl text-red-400"></i>
			</div>
			<h3 class="mb-2 text-lg font-medium text-gray-300">Agent not found</h3>
			<p class="mb-6 text-gray-400">The requested agent could not be found.</p>
			<a
				href="/app/org/{data.organization_id}/project/{data.project._id}/agents"
				class="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
			>
				<i class="fas fa-arrow-left"></i>
				<span>Back to Agents</span>
			</a>
		</div>
	</div>
{:else}
	<div class="min-h-screen">
		<!-- Hero Section -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br {getTypeColor(
							agent.type
						)}"
					>
						<i class="{getTypeIcon(agent.type)} text-xl text-white"></i>
					</div>
					<div>
						<h1 class="text-3xl font-bold text-gray-100">{agent.name}</h1>
						<p class="text-gray-400">{agent.description || 'AI Agent'}</p>
					</div>
					<div class="flex items-center space-x-2">
						<span
							class="inline-flex items-center rounded-full bg-gradient-to-r {getTypeColor(
								agent.type
							)} px-3 py-1 text-sm font-medium text-white"
						>
							<i class="{getTypeIcon(agent.type)} mr-1"></i>
							{agent.type}
						</span>
						{#if agent.is_active}
							<span
								class="inline-flex items-center rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-400"
							>
								<span class="mr-1 h-2 w-2 rounded-full bg-green-400"></span>
								Active
							</span>
						{:else}
							<span
								class="inline-flex items-center rounded-full bg-gray-500/10 px-3 py-1 text-sm font-medium text-gray-400"
							>
								<span class="mr-1 h-2 w-2 rounded-full bg-gray-400"></span>
								Inactive
							</span>
						{/if}
					</div>
				</div>
				<div class="flex space-x-3">
					{#if agent.type === 'chatbot'}
						<button
							on:click={() => (showChatModal = true)}
							class="flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<i class="fas fa-comments"></i>
							<span>Start Chat</span>
						</button>
					{:else}
						<button
							on:click={() => (showExecuteModal = true)}
							class="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2.5 text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
						>
							<i class="fas fa-play"></i>
							<span>Execute</span>
						</button>
					{/if}
					<button
						on:click={() => (showEditModal = true)}
						class="flex items-center space-x-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500"
					>
						<i class="fas fa-edit"></i>
						<span>Edit</span>
					</button>

					{#if agent.tools && agent.tools.map((tool) => tool.name).includes('api_caller')}
						<button
							on:click={() => (showApiConfigModal = true)}
							class="flex items-center space-x-2 rounded-lg border border-red-700 bg-red-600 px-4 py-2.5 text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
						>
							<i class="fas fa-plug"></i>
							<span>Configure APIs</span>
						</button>
					{/if}
				</div>
			</div>

			<!-- Breadcrumb -->
			<nav class="mt-4 flex items-center space-x-2 text-sm text-gray-400">
				<a href="/app/org/{data.organization_id}" class="hover:text-gray-300">Projects</a>
				<i class="fas fa-chevron-right text-xs"></i>
				<a
					href="/app/org/{data.organization_id}/project/{data.project._id}"
					class="hover:text-gray-300">{data.project.name}</a
				>
				<i class="fas fa-chevron-right text-xs"></i>
				<a
					href="/app/org/{data.organization_id}/project/{data.project._id}/agents"
					class="hover:text-gray-300">Agents</a
				>
				<i class="fas fa-chevron-right text-xs"></i>
				<span class="text-gray-200">{agent.name}</span>
			</nav>
		</div>

		<!-- Agent Configuration -->
		<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Configuration Card -->
			<div class="rounded-xl border border-gray-800 bg-gray-900 p-6 lg:col-span-2">
				<h2 class="mb-4 text-xl font-semibold text-gray-100">Configuration</h2>

				<div class="space-y-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<h3 class="text-sm font-medium text-gray-400">Model</h3>
							<p class="mt-1 text-gray-100">{agent.llm_settings?.model || 'Not configured'}</p>
						</div>
						<div>
							<h3 class="text-sm font-medium text-gray-400">Temperature</h3>
							<p class="mt-1 text-gray-100">
								{agent.llm_settings?.parameters?.temperature || 'Default'}
							</p>
						</div>
						<div>
							<h3 class="text-sm font-medium text-gray-400">Max Tokens</h3>
							<p class="mt-1 text-gray-100">
								{agent.llm_settings?.parameters?.max_tokens || 'Default'}
							</p>
						</div>
						<div>
							<h3 class="text-sm font-medium text-gray-400">Created</h3>
							<p class="mt-1 text-gray-100">{formatDate(agent.createdAt)}</p>
						</div>
					</div>

					{#if agent.system_prompt}
						<div>
							<h3 class="text-sm font-medium text-gray-400">System Prompt</h3>
							<div class="mt-2 rounded-lg bg-gray-800 p-4">
								<p class="whitespace-pre-wrap text-gray-100">{agent.system_prompt}</p>
							</div>
						</div>
					{/if}

					{#if agent.tools && agent.tools.length > 0}
						<div>
							<h3 class="mb-2 text-sm font-medium text-gray-400">Available Tools</h3>
							<div class="flex flex-wrap gap-2">
								{#each agent.tools.map((tool) => tool.name) as tool}
									<span
										class="inline-flex items-center rounded-md {getToolColor(
											tool
										)} px-2.5 py-1 text-sm font-medium"
									>
										<i class="{getToolIcon(tool)} mr-1"></i>
										{tool}
									</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Statistics Card -->
			<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
				<h2 class="mb-4 text-xl font-semibold text-gray-100">Statistics</h2>

				<div class="space-y-4">
					{#if agent.type === 'chatbot'}
						<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm text-gray-400">Conversations</p>
									<p class="text-2xl font-bold text-blue-400">{conversations?.total}</p>
								</div>
								<i class="fas fa-comments text-blue-400"></i>
							</div>
						</div>
					{:else}
						<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm text-gray-400">Executions</p>
									<p class="text-2xl font-bold text-green-400">{executions.length}</p>
								</div>
								<i class="fas fa-play text-green-400"></i>
							</div>
						</div>
					{/if}

					<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm text-gray-400">Status</p>
								<p class="text-lg font-bold {agent.is_active ? 'text-green-400' : 'text-gray-400'}">
									{agent.is_active ? 'Active' : 'Inactive'}
								</p>
							</div>
							<i
								class="fas {agent.is_active
									? 'fa-check-circle text-green-400'
									: 'fa-pause-circle text-gray-400'}"
							></i>
						</div>
					</div>

					<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm text-gray-400">Last Updated</p>
								<p class="text-sm font-medium text-gray-200">
									{formatDate(agent.updatedAt || agent.createdAt)}
								</p>
							</div>
							<i class="fas fa-clock text-purple-400"></i>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Activity Section -->
		<div class="rounded-xl border border-gray-800 bg-gray-900">
			<div class="border-b border-gray-800 p-6">
				<h2 class="text-xl font-semibold text-gray-100">
					{agent.type === 'chatbot' ? 'Recent Conversations' : 'Recent Executions'}
				</h2>
			</div>

			<div class="p-6">
				{#if agent.type === 'chatbot'}
					{#if conversations?.total === 0}
						<div class="py-16 text-center">
							<div
								class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10"
							>
								<i class="fas fa-comments text-2xl text-blue-400"></i>
							</div>
							<h3 class="mb-2 text-lg font-medium text-gray-300">No conversations yet</h3>
							<p class="mb-6 text-gray-400">
								Start a conversation with this agent to see the history here.
							</p>
							<button
								on:click={() => (showChatModal = true)}
								class="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
							>
								<i class="fas fa-comments"></i>
								<span>Start First Conversation</span>
							</button>
						</div>
					{:else}
						<div class="space-y-4">
							{#each conversations?.conversations || [] as conversation}
								<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
									<div class="flex items-center justify-between">
										<div>
											<h4 class="font-medium text-gray-100">Conversation - {conversation.title}</h4>
											<p class="text-sm text-gray-400">
												{conversation.messages?.length || 0} messages • {formatDate(
													conversation.updatedAt
												)}
											</p>
										</div>
										<button
											class="rounded-lg bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
										>
											Cost - {conversation.metadata.total_cost || 'N/A'} $
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{:else if executions.length === 0}
					<div class="py-16 text-center">
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10"
						>
							<i class="fas fa-play text-2xl text-green-400"></i>
						</div>
						<h3 class="mb-2 text-lg font-medium text-gray-300">No executions yet</h3>
						<p class="mb-6 text-gray-400">Execute this agent to see the execution history here.</p>
						<button
							on:click={() => (showExecuteModal = true)}
							class="inline-flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
						>
							<i class="fas fa-play"></i>
							<span>Execute Agent</span>
						</button>
					</div>
				{:else}
					<div class="space-y-4">
						{#each executions.slice(0, 10) as execution}
							<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
								<div class="flex items-center justify-between">
									<div>
										<h4 class="font-medium text-gray-100">Execution #{execution.id}</h4>
										<p class="text-sm text-gray-400">
											{execution.status || 'Completed'} • {formatDate(execution.createdAt)}
										</p>
										{#if execution.execution_time}
											<p class="text-xs text-gray-500">Duration: {execution.execution_time}ms</p>
										{/if}
									</div>
									<span
										class="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400"
									>
										{execution.status || 'Success'}
									</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Chat Modal -->
	{#if showChatModal}
		<ChatAgentModal {data} {agent} on:close={() => (showChatModal = false)} />
	{/if}

	<!-- Execute Modal -->
	{#if showExecuteModal}
		<ExecuteAgentModal {data} {agent} on:close={() => (showExecuteModal = false)} />
	{/if}

	<!-- Edit Modal -->
	{#if showEditModal}
		<EditAgentModal
			{data}
			{agent}
			on:updated={handleAgentUpdated}
			on:close={() => (showEditModal = false)}
		/>
	{/if}

	<!-- API Configuration Modal -->
	{#if showApiConfigModal}
		<ConfigureApiEndpointsModal {data} {agent} on:close={() => (showApiConfigModal = false)} />
	{/if}
{/if}
