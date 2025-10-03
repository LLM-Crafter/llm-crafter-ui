<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api.js';
	import { theme } from '$lib/stores/theme';
	import ChatAgentModal from '$lib/ui/modal/ChatAgentModal.svelte';
	import ExecuteAgentModal from '$lib/ui/modal/ExecuteAgentModal.svelte';
	import EditAgentModal from '$lib/ui/modal/EditAgentModal.svelte';
	import ConfigureApiEndpointsModal from '$lib/ui/modal/ConfigureApiEndpointsModal.svelte';
	import ConfigureFaqModal from '$lib/ui/modal/ConfigureFaqModal.svelte';
	import ConfigureRagModal from '$lib/ui/modal/ConfigureRagModal.svelte';
	import ConfigureWebSearchModal from '$lib/ui/modal/ConfigureWebSearchModal.svelte';
	import ConfigureWebpageScraperModal from '$lib/ui/modal/ConfigureWebpageScraperModal.svelte';
	import ConfigureChannelsModal from '$lib/ui/modal/ConfigureChannelsModal.svelte';
	import ViewConversationModal from '$lib/ui/modal/ViewConversationModal.svelte';
	import type { AgentStatistics } from '$lib/api';

	export let data;

	let agent = null;
	let conversations = [];
	let executions = [];
	let statistics: AgentStatistics | null = null;
	let loading = true;
	let showChatModal = false;
	let showExecuteModal = false;
	let showEditModal = false;
	let showApiConfigModal = false;
	let showFaqConfigModal = false;
	let showRagConfigModal = false;
	let showWebSearchConfigModal = false;
	let showWebpageScraperConfigModal = false;
	let showChannelsConfigModal = false;
	let showViewConversationModal = false;
	let selectedConversationId = null;
	let selectedStatsPeriod: '1d' | '1w' | '1m' = '1d';
	let activeTab = 'overview'; // 'overview', 'configuration', 'activity', 'statistics'
	let showFullPrompt = false;
	let enabledChannels: string[] = [];

	const statsPeriods = [
		{ value: '1d', label: '24 Hours' },
		{ value: '1w', label: '7 Days' },
		{ value: '1m', label: '30 Days' }
	];

	onMount(async () => {
		await loadAgentData();
		await loadStatistics();
		if (agent?.type === 'chatbot') {
			await loadEnabledChannels();
		}
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

	async function loadEnabledChannels() {
		if (agent?.type !== 'chatbot') return;

		try {
			const response = await api.getEnabledChannels(
				data.organization_id,
				data.project._id,
				data.agent_id
			);
			// API now returns: { agent_id, enabled_channels: [...] }
			enabledChannels = response.enabled_channels || [];
		} catch (error) {
			console.error('Failed to load enabled channels:', error);
			enabledChannels = [];
		}
	}

	async function loadStatistics() {
		try {
			statistics = await api.getAgentStatistics(
				data.organization_id,
				data.agent_id,
				selectedStatsPeriod
			);
		} catch (error) {
			console.error('Failed to load agent statistics:', error);
		}
	}

	function handleStatsPeriodChange(event: Event) {
		selectedStatsPeriod = (event.target as HTMLSelectElement).value as '1d' | '1w' | '1m';
		loadStatistics();
	}

	function formatNumber(num: number): string {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		} else if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num.toString();
	}

	function formatDuration(ms: number): string {
		if (ms < 1000) {
			return `${ms}ms`;
		} else if (ms < 60000) {
			return `${(ms / 1000).toFixed(1)}s`;
		} else {
			return `${(ms / 60000).toFixed(1)}m`;
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
			case 'webpage_scraper':
				return 'fas fa-globe';
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
			case 'faq':
				return 'fas fa-question-circle';
			case 'rag_search':
				return 'fas fa-database';
			default:
				return 'fas fa-tools';
		}
	}

	function getToolColor(toolId) {
		switch (toolId) {
			case 'web_search':
				return 'text-blue-600 bg-blue-500/20 dark:text-blue-400';
			case 'webpage_scraper':
				return 'text-purple-600 bg-purple-500/20 dark:text-purple-400';
			case 'calculator':
				return 'text-green-600 bg-green-500/20 dark:text-green-400';
			case 'llm_prompt':
				return 'text-purple-600 bg-purple-500/20 dark:text-purple-400';
			case 'current_time':
				return 'text-yellow-600 bg-yellow-500/20 dark:text-yellow-400';
			case 'json_processor':
				return 'text-gray-600 bg-gray-500/20 dark:text-gray-400';
			case 'api_caller':
				return 'text-red-600 bg-red-500/20 dark:text-red-400';
			case 'faq':
				return 'text-cyan-600 bg-cyan-500/20 dark:text-cyan-400';
			case 'rag_search':
				return 'text-orange-600 bg-orange-500/20 dark:text-orange-400';
			default:
				return 'text-indigo-600 bg-indigo-500/20 dark:text-indigo-400';
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

	function openConversationModal(conversationId) {
		selectedConversationId = conversationId;
		showViewConversationModal = true;
	}

	async function handleAgentUpdated() {
		await loadAgentData();
		showEditModal = false;
	}

	function setActiveTab(tab: string) {
		activeTab = tab;
	}

	function truncateText(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

{#if loading}
	<!-- Skeleton Loading State -->
	<div class="min-h-screen">
		<!-- Hero Skeleton -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<div class="h-12 w-12 animate-pulse rounded-xl bg-gray-300 dark:bg-gray-700"></div>
					<div>
						<div class="mb-2 h-8 w-48 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
						<div class="h-4 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
					</div>
					<div class="flex space-x-2">
						<div class="h-6 w-16 animate-pulse rounded-full bg-gray-300 dark:bg-gray-700"></div>
						<div class="h-6 w-14 animate-pulse rounded-full bg-gray-300 dark:bg-gray-700"></div>
					</div>
				</div>
				<div class="flex space-x-3">
					<div class="h-10 w-24 animate-pulse rounded-lg bg-gray-300 dark:bg-gray-700"></div>
					<div class="h-10 w-16 animate-pulse rounded-lg bg-gray-300 dark:bg-gray-700"></div>
				</div>
			</div>
			<!-- Breadcrumb Skeleton -->
			<div class="mt-4 flex items-center space-x-2">
				<div class="h-4 w-16 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
				<div class="h-3 w-3 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
				<div class="h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
				<div class="h-3 w-3 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
				<div class="h-4 w-14 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
			</div>
		</div>

		<!-- Tabs Skeleton -->
		<div class="mb-6 border-b border-gray-200 dark:border-gray-700">
			<div class="flex space-x-8">
				{#each Array(4) as _}
					<div class="h-10 w-20 animate-pulse rounded-t bg-gray-300 dark:bg-gray-700"></div>
				{/each}
			</div>
		</div>

		<!-- Content Skeleton -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="lg:col-span-2">
				<div class="h-96 animate-pulse rounded-xl bg-gray-300 dark:bg-gray-700"></div>
			</div>
			<div>
				<div class="h-64 animate-pulse rounded-xl bg-gray-300 dark:bg-gray-700"></div>
			</div>
		</div>
	</div>
{:else if !agent}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
			>
				<i class="fas fa-exclamation-triangle text-2xl text-red-500 dark:text-red-400"></i>
			</div>
			<h3 class="mb-2 text-lg font-medium text-gray-800 dark:text-gray-200">Agent not found</h3>
			<p class="mb-6 text-gray-600 dark:text-gray-400">The requested agent could not be found.</p>
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
			<div
				class="flex flex-col items-start justify-between space-y-4 lg:flex-row lg:items-center lg:space-y-0"
			>
				<div class="flex items-center space-x-4">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br {getTypeColor(
							agent.type
						)}"
					>
						<i class="{getTypeIcon(agent.type)} text-xl text-white"></i>
					</div>
					<div>
						<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
							{agent.name}
						</h1>
						<p class="text-gray-600 dark:text-gray-400">{agent.description || 'AI Agent'}</p>
					</div>
					<div class="hidden items-center space-x-2 sm:flex">
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
				<div class="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap sm:space-x-3">
					{#if agent.type === 'chatbot'}
						<button
							on:click={() => (showChatModal = true)}
							class="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:flex-initial"
						>
							<i class="fas fa-comments"></i>
							<span class="hidden sm:inline">Start Chat</span>
							<span class="sm:hidden">Chat</span>
						</button>
					{:else}
						<button
							on:click={() => (showExecuteModal = true)}
							class="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-green-600 px-4 py-2.5 text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 sm:flex-initial"
						>
							<i class="fas fa-play"></i>
							<span class="hidden sm:inline">Execute</span>
							<span class="sm:hidden">Run</span>
						</button>
					{/if}
					<button
						on:click={() => (showEditModal = true)}
						class="flex flex-1 items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white sm:flex-initial"
					>
						<i class="fas fa-edit"></i>
						<span class="hidden sm:inline">Edit</span>
					</button>

					<!-- Mobile: Show Configure buttons in overflow menu, Desktop: Show inline -->
					<div class="hidden sm:flex sm:space-x-3">
						{#if agent.tools && agent.tools.map((tool) => tool.name).includes('api_caller')}
							<button
								on:click={() => (showApiConfigModal = true)}
								class="flex items-center space-x-2 rounded-lg border border-red-300 bg-red-600 px-4 py-2.5 text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-700"
							>
								<i class="fas fa-plug"></i>
								<span class="hidden lg:inline">Configure APIs</span>
								<span class="lg:hidden">APIs</span>
							</button>
						{/if}

						{#if agent.tools && agent.tools.map((tool) => tool.name).includes('faq')}
							<button
								on:click={() => (showFaqConfigModal = true)}
								class="flex items-center space-x-2 rounded-lg border border-cyan-300 bg-cyan-600 px-4 py-2.5 text-white transition-colors hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-cyan-700"
							>
								<i class="fas fa-question-circle"></i>
								<span class="hidden lg:inline">Configure FAQ</span>
								<span class="lg:hidden">FAQ</span>
							</button>
						{/if}

						{#if agent.tools && agent.tools.map((tool) => tool.name).includes('rag_search')}
							<button
								on:click={() => (showRagConfigModal = true)}
								class="flex items-center space-x-2 rounded-lg border border-orange-300 bg-orange-600 px-4 py-2.5 text-white transition-colors hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-orange-700"
							>
								<i class="fas fa-database"></i>
								<span class="hidden lg:inline">Configure RAG</span>
								<span class="lg:hidden">RAG</span>
							</button>
						{/if}

						{#if agent.tools && agent.tools.map((tool) => tool.name).includes('web_search')}
							<button
								on:click={() => (showWebSearchConfigModal = true)}
								class="flex items-center space-x-2 rounded-lg border border-blue-300 bg-blue-600 px-4 py-2.5 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-700"
							>
								<i class="fas fa-search"></i>
								<span class="hidden lg:inline">Configure Web Search</span>
								<span class="lg:hidden">Web Search</span>
							</button>
						{/if}

						{#if agent.tools && agent.tools.map((tool) => tool.name).includes('webpage_scraper')}
							<button
								on:click={() => (showWebpageScraperConfigModal = true)}
								class="flex items-center space-x-2 rounded-lg border border-purple-300 bg-purple-600 px-4 py-2.5 text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-purple-700"
							>
								<i class="fas fa-globe"></i>
								<span class="hidden lg:inline">Configure Webpage Scraper</span>
								<span class="lg:hidden">Scraper</span>
							</button>
						{/if}
					</div>
				</div>
			</div>

			<!-- Mobile Status Badges -->
			<div class="mt-4 flex items-center space-x-2 sm:hidden">
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

			<!-- Breadcrumb -->
			<nav class="mt-4 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
				<a
					href="/app/org/{data.organization_id}"
					class="hover:text-gray-900 dark:hover:text-gray-300">Projects</a
				>
				<i class="fas fa-chevron-right text-xs"></i>
				<a
					href="/app/org/{data.organization_id}/project/{data.project._id}"
					class="hover:text-gray-900 dark:hover:text-gray-300">{data.project.name}</a
				>
				<i class="fas fa-chevron-right text-xs"></i>
				<a
					href="/app/org/{data.organization_id}/project/{data.project._id}/agents"
					class="hover:text-gray-900 dark:hover:text-gray-300">Agents</a
				>
				<i class="fas fa-chevron-right text-xs"></i>
				<span class="text-gray-900 dark:text-gray-200">{agent.name}</span>
			</nav>
		</div>

		<!-- Tab Navigation -->
		<div class="mb-8 border-b border-gray-200 dark:border-gray-700">
			<nav class="-mb-px flex space-x-8 overflow-x-auto">
				<button
					on:click={() => setActiveTab('overview')}
					class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab ===
					'overview'
						? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'}"
				>
					<i class="fas fa-home mr-2"></i>
					Overview
				</button>
				<button
					on:click={() => setActiveTab('configuration')}
					class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab ===
					'configuration'
						? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'}"
				>
					<i class="fas fa-cog mr-2"></i>
					Configuration
				</button>
				<button
					on:click={() => setActiveTab('activity')}
					class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab ===
					'activity'
						? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'}"
				>
					<i class="fas fa-chart-line mr-2"></i>
					Activity
				</button>
				<button
					on:click={() => setActiveTab('statistics')}
					class="whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors {activeTab ===
					'statistics'
						? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'}"
				>
					<i class="fas fa-chart-bar mr-2"></i>
					Statistics
				</button>
			</nav>
		</div>

		<!-- Tab Content -->
		{#if activeTab === 'overview'}
			<!-- Overview Tab -->
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<!-- Quick Stats -->
				<div class="space-y-6 lg:col-span-2">
					<!-- Quick Metrics -->
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#if agent.type === 'chatbot'}
							<div
								class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
							>
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="rounded-md bg-blue-500 p-2">
											<i class="fas fa-comments text-white"></i>
										</div>
									</div>
									<div class="ml-4">
										<p class="text-sm font-medium text-gray-600 dark:text-gray-400">
											Conversations
										</p>
										<p class="text-2xl font-semibold text-gray-900 dark:text-white">
											{conversations?.total || 0}
										</p>
									</div>
								</div>
							</div>
						{:else}
							<div
								class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
							>
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="rounded-md bg-green-500 p-2">
											<i class="fas fa-play text-white"></i>
										</div>
									</div>
									<div class="ml-4">
										<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Executions</p>
										<p class="text-2xl font-semibold text-gray-900 dark:text-white">
											{executions.length}
										</p>
									</div>
								</div>
							</div>
						{/if}

						<div
							class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
						>
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="rounded-md bg-purple-500 p-2">
										<i class="fas fa-tools text-white"></i>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Tools</p>
									<p class="text-2xl font-semibold text-gray-900 dark:text-white">
										{agent.tools?.length || 0}
									</p>
								</div>
							</div>
						</div>

						<div
							class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
						>
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="rounded-md p-2 {agent.is_active ? 'bg-green-500' : 'bg-gray-500'}">
										<i
											class="fas {agent.is_active
												? 'fa-check-circle'
												: 'fa-pause-circle'} text-white"
										></i>
									</div>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
									<p
										class="text-lg font-semibold {agent.is_active
											? 'text-green-600 dark:text-green-400'
											: 'text-gray-600 dark:text-gray-400'}"
									>
										{agent.is_active ? 'Active' : 'Inactive'}
									</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Recent Activity Preview -->
					<div
						class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
					>
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
								Recent {agent.type === 'chatbot' ? 'Conversations' : 'Executions'}
							</h3>
							<button
								on:click={() => setActiveTab('activity')}
								class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
							>
								View all →
							</button>
						</div>

						{#if agent.type === 'chatbot'}
							{#if conversations?.total === 0}
								<div class="py-8 text-center">
									<div
										class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10"
									>
										<i class="fas fa-comments text-blue-600 dark:text-blue-400"></i>
									</div>
									<p class="text-gray-600 dark:text-gray-400">No conversations yet</p>
								</div>
							{:else}
								<div class="space-y-3">
									{#each (conversations?.conversations || []).slice(0, 3) as conversation}
										<div
											class="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700"
										>
											<div>
												<p class="font-medium text-gray-900 dark:text-gray-100">
													{conversation.title || 'Untitled Conversation'}
												</p>
												<p class="text-sm text-gray-500 dark:text-gray-400">
													{conversation.messages?.length || 0} messages • {formatDate(
														conversation.updatedAt
													)}
												</p>
											</div>
											<span
												class="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400"
											>
												${conversation.metadata?.total_cost || '0.00'}
											</span>
										</div>
									{/each}
								</div>
							{/if}
						{:else if executions.length === 0}
							<div class="py-8 text-center">
								<div
									class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10"
								>
									<i class="fas fa-play text-green-600 dark:text-green-400"></i>
								</div>
								<p class="text-gray-600 dark:text-gray-400">No executions yet</p>
							</div>
						{:else}
							<div class="space-y-3">
								{#each executions as execution}
									<div
										class="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700"
									>
										<div>
											<p class="font-medium text-gray-900 dark:text-gray-100">
												Execution #{execution.id}
											</p>
											<p class="text-sm text-gray-500 dark:text-gray-400">
												{execution.status || 'Completed'} • {formatDate(execution.createdAt)}
											</p>
										</div>
										<span
											class="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400"
										>
											{execution.execution_time || 0}ms
										</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Right Sidebar -->
				<div class="space-y-6">
					<!-- Agent Info Card -->
					<div
						class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
					>
						<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Agent Info</h3>
						<div class="space-y-3">
							<div>
								<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Type</p>
								<span
									class="mt-1 inline-flex items-center rounded-full bg-gradient-to-r {getTypeColor(
										agent.type
									)} px-3 py-1 text-sm font-medium text-white"
								>
									<i class="{getTypeIcon(agent.type)} mr-1"></i>
									{agent.type}
								</span>
							</div>
							<div>
								<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Model</p>
								<p class="mt-1 text-gray-900 dark:text-gray-100">
									{agent.llm_settings?.model || 'Not configured'}
								</p>
							</div>
							<div>
								<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Created</p>
								<p class="mt-1 text-gray-900 dark:text-gray-100">{formatDate(agent.createdAt)}</p>
							</div>
						</div>
					</div>

					<!-- Quick Actions -->
					<div
						class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
					>
						<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
							Quick Actions
						</h3>
						<div class="space-y-3">
							{#if agent.type === 'chatbot'}
								<button
									on:click={() => (showChatModal = true)}
									class="flex w-full items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-white transition-colors hover:bg-indigo-700"
								>
									<i class="fas fa-comments"></i>
									<span>Start Chat</span>
								</button>
							{:else}
								<button
									on:click={() => (showExecuteModal = true)}
									class="flex w-full items-center justify-center space-x-2 rounded-lg bg-green-600 px-4 py-2.5 text-white transition-colors hover:bg-green-700"
								>
									<i class="fas fa-play"></i>
									<span>Execute Agent</span>
								</button>
							{/if}
							<button
								on:click={() => (showEditModal = true)}
								class="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
							>
								<i class="fas fa-edit"></i>
								<span>Edit Agent</span>
							</button>
						</div>
					</div>

					<!-- Tools Preview -->
					{#if agent.tools && agent.tools.length > 0}
						<div
							class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
						>
							<div class="mb-4 flex items-center justify-between">
								<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Tools</h3>
								<button
									on:click={() => setActiveTab('configuration')}
									class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
								>
									View all →
								</button>
							</div>
							<div class="flex flex-wrap gap-2">
								{#each agent.tools.map((tool) => tool.name).slice(0, 4) as tool}
									<span
										class="inline-flex items-center rounded-md {getToolColor(
											tool
										)} px-2.5 py-1 text-xs font-medium"
									>
										<i class="{getToolIcon(tool)} mr-1"></i>
										{tool}
									</span>
								{/each}
								{#if agent.tools.length > 4}
									<span
										class="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400"
									>
										+{agent.tools.length - 4} more
									</span>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Channels Preview (for chatbots) -->
					{#if agent.type === 'chatbot'}
						<div
							class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
						>
							<div class="mb-4 flex items-center justify-between">
								<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
									<i class="fas fa-broadcast-tower mr-2 text-teal-600"></i>Channels
								</h3>
								<button
									on:click={() => (showChannelsConfigModal = true)}
									class="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400"
								>
									Configure →
								</button>
							</div>
							{#if enabledChannels.length > 0}
								<div class="space-y-2">
									{#each enabledChannels as channel}
										<div
											class="flex items-center justify-between rounded-lg bg-gray-50 p-2 dark:bg-gray-800"
										>
											<div class="flex items-center space-x-2">
												{#if channel === 'whatsapp'}
													<i class="fab fa-whatsapp text-green-600"></i>
													<span class="text-sm font-medium text-gray-900 dark:text-gray-100"
														>WhatsApp</span
													>
												{:else if channel === 'telegram'}
													<i class="fab fa-telegram text-blue-600"></i>
													<span class="text-sm font-medium text-gray-900 dark:text-gray-100"
														>Telegram</span
													>
												{:else if channel === 'email'}
													<i class="fas fa-envelope text-purple-600"></i>
													<span class="text-sm font-medium text-gray-900 dark:text-gray-100"
														>Email</span
													>
												{:else if channel === 'website'}
													<i class="fas fa-globe text-indigo-600"></i>
													<span class="text-sm font-medium text-gray-900 dark:text-gray-100"
														>Website</span
													>
												{/if}
											</div>
											<span
												class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
											>
												<i class="fas fa-check-circle mr-1"></i>Active
											</span>
										</div>
									{/each}
								</div>
							{:else}
								<div class="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
									<i class="fas fa-plug mb-2 text-2xl text-gray-400"></i>
									<p class="text-sm text-gray-600 dark:text-gray-400">No channels configured</p>
									<button
										on:click={() => (showChannelsConfigModal = true)}
										class="mt-2 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
									>
										Configure channels
									</button>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if activeTab === 'configuration'}
			<!-- Configuration Tab -->
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div class="space-y-6 lg:col-span-2">
					<!-- LLM Configuration -->
					<div
						class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
					>
						<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
							LLM Configuration
						</h3>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label class="text-sm font-medium text-gray-600 dark:text-gray-400">Model</label>
								<p class="mt-1 text-gray-900 dark:text-gray-100">
									{agent.llm_settings?.model || 'Not configured'}
								</p>
							</div>
							<div>
								<label class="text-sm font-medium text-gray-600 dark:text-gray-400"
									>Temperature</label
								>
								<p class="mt-1 text-gray-900 dark:text-gray-100">
									{agent.llm_settings?.parameters?.temperature || 'Default (0.7)'}
								</p>
							</div>
							<div>
								<label class="text-sm font-medium text-gray-600 dark:text-gray-400"
									>Max Tokens</label
								>
								<p class="mt-1 text-gray-900 dark:text-gray-100">
									{agent.llm_settings?.parameters?.max_tokens || 'Default (4096)'}
								</p>
							</div>
							<div>
								<label class="text-sm font-medium text-gray-600 dark:text-gray-400">Top P</label>
								<p class="mt-1 text-gray-900 dark:text-gray-100">
									{agent.llm_settings?.parameters?.top_p || 'Default (1.0)'}
								</p>
							</div>
						</div>
					</div>

					<!-- System Prompt -->
					{#if agent.system_prompt}
						<div
							class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
						>
							<div class="mb-4 flex items-center justify-between">
								<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
									System Prompt
								</h3>
								<div class="flex space-x-2">
									<button
										on:click={() => copyToClipboard(agent.system_prompt)}
										class="flex items-center space-x-1 rounded-md bg-gray-100 px-2 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
										title="Copy to clipboard"
									>
										<i class="fas fa-copy"></i>
										<span class="hidden sm:inline">Copy</span>
									</button>
									<button
										on:click={() => (showFullPrompt = !showFullPrompt)}
										class="flex items-center space-x-1 rounded-md bg-indigo-100 px-2 py-1 text-sm text-indigo-600 transition-colors hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-800"
									>
										<i class="fas {showFullPrompt ? 'fa-eye-slash' : 'fa-eye'}"></i>
										<span class="hidden sm:inline">{showFullPrompt ? 'Collapse' : 'Expand'}</span>
									</button>
								</div>
							</div>

							<div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
								{#if showFullPrompt}
									<pre
										class="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">{agent.system_prompt}</pre>
								{:else}
									<div class="space-y-2">
										<p class="text-sm text-gray-900 dark:text-gray-100">
											{truncateText(agent.system_prompt, 200)}
										</p>
										{#if agent.system_prompt.length > 200}
											<button
												on:click={() => (showFullPrompt = true)}
												class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
											>
												Show {agent.system_prompt.length - 200} more characters...
											</button>
										{/if}
									</div>
								{/if}
							</div>

							<div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
								{agent.system_prompt.length} characters
							</div>
						</div>
					{/if}

					<!-- Tools Configuration -->
					{#if agent.tools && agent.tools.length > 0}
						<div
							class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
						>
							<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
								Available Tools ({agent.tools.length})
							</h3>
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{#each agent.tools.map((tool) => tool.name) as tool}
									<div
										class="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
									>
										<div class="flex items-center space-x-3">
											<div class="flex-shrink-0">
												<div class="rounded-md {getToolColor(tool)} p-2">
													<i class="{getToolIcon(tool)} text-sm"></i>
												</div>
											</div>
											<div>
												<p class="font-medium text-gray-900 dark:text-gray-100">{tool}</p>
												<p class="text-sm text-gray-500 dark:text-gray-400">
													{tool === 'web_search'
														? 'Search the web for information'
														: tool === 'webpage_scraper'
															? 'Extract content from web pages'
															: tool === 'calculator'
																? 'Perform mathematical calculations'
																: tool === 'llm_prompt'
																	? 'Generate text using LLM'
																	: tool === 'current_time'
																		? 'Get current date and time'
																		: tool === 'json_processor'
																			? 'Process and manipulate JSON data'
																			: tool === 'api_caller'
																				? 'Make HTTP API calls'
																				: tool === 'faq'
																					? 'Answer frequently asked questions'
																					: tool === 'rag_search'
																						? 'Search indexed documents and knowledge base'
																						: 'Custom tool functionality'}
												</p>
											</div>
										</div>
										{#if tool === 'api_caller'}
											<button
												on:click={() => (showApiConfigModal = true)}
												class="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
											>
												Configure
											</button>
										{:else if tool === 'faq'}
											<button
												on:click={() => (showFaqConfigModal = true)}
												class="text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
											>
												Configure
											</button>
										{:else if tool === 'rag_search'}
											<button
												on:click={() => (showRagConfigModal = true)}
												class="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400"
											>
												Configure
											</button>
										{:else if tool === 'web_search'}
											<button
												on:click={() => (showWebSearchConfigModal = true)}
												class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
											>
												Configure
											</button>
										{:else if tool === 'webpage_scraper'}
											<button
												on:click={() => (showWebpageScraperConfigModal = true)}
												class="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
											>
												Configure
											</button>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Configuration Sidebar -->
				<div class="space-y-6">
					<!-- Agent Metadata -->
					<div
						class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
					>
						<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Metadata</h3>
						<div class="space-y-3">
							<div>
								<label class="text-sm font-medium text-gray-600 dark:text-gray-400">Agent ID</label>
								<p class="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
									{data.agent_id}
								</p>
							</div>
							<div>
								<label class="text-sm font-medium text-gray-600 dark:text-gray-400">Created</label>
								<p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
									{formatDate(agent.createdAt)}
								</p>
							</div>
							<div>
								<label class="text-sm font-medium text-gray-600 dark:text-gray-400"
									>Last Updated</label
								>
								<p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
									{formatDate(agent.updatedAt || agent.createdAt)}
								</p>
							</div>
							<div>
								<label class="text-sm font-medium text-gray-600 dark:text-gray-400">Version</label>
								<p class="mt-1 text-sm text-gray-900 dark:text-gray-100">
									{agent.version || '1.0.0'}
								</p>
							</div>
						</div>
					</div>

					<!-- Quick Configuration Actions -->
					<div
						class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
					>
						<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
							Configuration Actions
						</h3>
						<div class="space-y-3">
							<button
								on:click={() => (showEditModal = true)}
								class="flex w-full items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-white transition-colors hover:bg-indigo-700"
							>
								<i class="fas fa-edit"></i>
								<span>Edit Configuration</span>
							</button>

							{#if agent.type === 'chatbot'}
								<button
									on:click={() => (showChannelsConfigModal = true)}
									class="flex w-full items-center justify-center space-x-2 rounded-lg border border-teal-300 bg-teal-600 px-4 py-2.5 text-white transition-colors hover:bg-teal-700"
								>
									<i class="fas fa-broadcast-tower"></i>
									<span>Configure Channels</span>
								</button>
							{/if}

							{#if agent.tools && agent.tools.map((tool) => tool.name).includes('api_caller')}
								<button
									on:click={() => (showApiConfigModal = true)}
									class="flex w-full items-center justify-center space-x-2 rounded-lg border border-red-300 bg-red-600 px-4 py-2.5 text-white transition-colors hover:bg-red-700"
								>
									<i class="fas fa-plug"></i>
									<span>Configure APIs</span>
								</button>
							{/if}

							{#if agent.tools && agent.tools.map((tool) => tool.name).includes('faq')}
								<button
									on:click={() => (showFaqConfigModal = true)}
									class="flex w-full items-center justify-center space-x-2 rounded-lg border border-cyan-300 bg-cyan-600 px-4 py-2.5 text-white transition-colors hover:bg-cyan-700"
								>
									<i class="fas fa-question-circle"></i>
									<span>Configure FAQ</span>
								</button>
							{/if}

							{#if agent.tools && agent.tools.map((tool) => tool.name).includes('rag_search')}
								<button
									on:click={() => (showRagConfigModal = true)}
									class="flex w-full items-center justify-center space-x-2 rounded-lg border border-orange-300 bg-orange-600 px-4 py-2.5 text-white transition-colors hover:bg-orange-700"
								>
									<i class="fas fa-database"></i>
									<span>Configure RAG</span>
								</button>
							{/if}

							{#if agent.tools && agent.tools.map((tool) => tool.name).includes('web_search')}
								<button
									on:click={() => (showWebSearchConfigModal = true)}
									class="flex w-full items-center justify-center space-x-2 rounded-lg border border-blue-300 bg-blue-600 px-4 py-2.5 text-white transition-colors hover:bg-blue-700"
								>
									<i class="fas fa-search"></i>
									<span>Configure Web Search</span>
								</button>
							{/if}

							{#if agent.tools && agent.tools.map((tool) => tool.name).includes('webpage_scraper')}
								<button
									on:click={() => (showWebpageScraperConfigModal = true)}
									class="flex w-full items-center justify-center space-x-2 rounded-lg border border-purple-300 bg-purple-600 px-4 py-2.5 text-white transition-colors hover:bg-purple-700"
								>
									<i class="fas fa-globe"></i>
									<span>Configure Webpage Scraper</span>
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if activeTab === 'activity'}
			<!-- Activity Tab -->
			<div
				class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
			>
				<div class="mb-6 flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
						{agent.type === 'chatbot' ? 'Conversation History' : 'Execution History'}
					</h2>
					<div class="flex items-center space-x-3">
						<!-- Filter and search can be added here -->
						<span class="text-sm text-gray-500 dark:text-gray-400">
							{agent.type === 'chatbot'
								? `${conversations?.total || 0} conversations`
								: `${executions.length} executions`}
						</span>
					</div>
				</div>

				{#if agent.type === 'chatbot'}
					{#if conversations?.total === 0}
						<div class="py-16 text-center">
							<div
								class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10"
							>
								<i class="fas fa-comments text-2xl text-blue-600 dark:text-blue-400"></i>
							</div>
							<h3 class="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
								No conversations yet
							</h3>
							<p class="mb-6 text-gray-600 dark:text-gray-400">
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
							{#each conversations?.conversations || [] as conversation, index}
								<div
									class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
								>
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<div class="flex items-center space-x-2">
												<h4 class="font-medium text-gray-900 dark:text-gray-100">
													{conversation.title || `Conversation #${index + 1}`}
												</h4>
												<span
													class="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400"
												>
													{conversation.messages?.length || 0} messages
												</span>
											</div>
											<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
												Last activity: {formatDate(conversation.updatedAt)}
											</p>
											{#if conversation.messages && conversation.messages.length > 0}
												<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
													Last message: {truncateText(
														conversation.messages[conversation.messages.length - 1]?.content || '',
														100
													)}
												</p>
											{/if}
										</div>
										<div class="flex items-center space-x-3">
											<div class="text-right">
												<p class="text-sm font-medium text-gray-900 dark:text-gray-100">
													${conversation.metadata?.total_cost || '0.0000'}
												</p>
												<p class="text-xs text-gray-500 dark:text-gray-400">Cost</p>
											</div>
											<button
												on:click={() => openConversationModal(conversation._id)}
												class="rounded-lg bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
											>
												View
											</button>
										</div>
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
							<i class="fas fa-play text-2xl text-green-600 dark:text-green-400"></i>
						</div>
						<h3 class="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
							No executions yet
						</h3>
						<p class="mb-6 text-gray-600 dark:text-gray-400">
							Execute this agent to see the execution history here.
						</p>
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
						{#each executions as execution, index}
							<div
								class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
							>
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="flex items-center space-x-2">
											<h4 class="font-medium text-gray-900 dark:text-gray-100">
												Execution #{execution.id || index + 1}
											</h4>
											<span
												class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {execution.status ===
												'completed'
													? 'bg-green-500/10 text-green-600 dark:text-green-400'
													: execution.status === 'failed'
														? 'bg-red-500/10 text-red-600 dark:text-red-400'
														: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'}"
											>
												{execution.status || 'Completed'}
											</span>
										</div>
										<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
											Executed: {formatDate(execution.createdAt)}
										</p>
										{#if execution.input}
											<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
												Input: {truncateText(execution.input, 100)}
											</p>
										{/if}
										{#if execution.output}
											<p class="mt-1 text-sm text-gray-700 dark:text-gray-300">
												Output: {truncateText(execution.output, 100)}
											</p>
										{/if}
									</div>
									<div class="flex items-center space-x-3">
										<div class="text-right">
											<p class="text-sm font-medium text-gray-900 dark:text-gray-100">
												{execution.execution_time || 0}ms
											</p>
											<p class="text-xs text-gray-500 dark:text-gray-400">Duration</p>
										</div>
										<button
											class="rounded-lg bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
										>
											View
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		{#if activeTab === 'statistics'}
			<!-- Statistics Tab -->
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
					Performance Statistics
				</h2>
				<select
					bind:value={selectedStatsPeriod}
					on:change={handleStatsPeriodChange}
					class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
				>
					{#each statsPeriods as period}
						<option value={period.value}>{period.label}</option>
					{/each}
				</select>
			</div>

			{#if statistics}
				<!-- Statistics Overview Cards -->
				<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{#if agent.type === 'chatbot'}
						<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="rounded-md bg-blue-500 p-3">
										<i class="fas fa-comments text-white"></i>
									</div>
								</div>
								<div class="ml-5 w-0 flex-1">
									<dl>
										<dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
											Total Conversations
										</dt>
										<dd class="text-lg font-medium text-gray-900 dark:text-white">
											{formatNumber(statistics.conversations?.total || 0)}
										</dd>
									</dl>
								</div>
							</div>
						</div>

						<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="rounded-md bg-green-500 p-3">
										<i class="fas fa-message text-white"></i>
									</div>
								</div>
								<div class="ml-5 w-0 flex-1">
									<dl>
										<dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
											Total Messages
										</dt>
										<dd class="text-lg font-medium text-gray-900 dark:text-white">
											{formatNumber(statistics.conversations?.totalMessages || 0)}
										</dd>
									</dl>
								</div>
							</div>
						</div>

						<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="rounded-md bg-purple-500 p-3">
										<i class="fas fa-coins text-white"></i>
									</div>
								</div>
								<div class="ml-5 w-0 flex-1">
									<dl>
										<dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
											Total Tokens
										</dt>
										<dd class="text-lg font-medium text-gray-900 dark:text-white">
											{formatNumber(statistics.conversations?.totalTokens || 0)}
										</dd>
									</dl>
								</div>
							</div>
						</div>

						<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="rounded-md bg-orange-500 p-3">
										<i class="fas fa-dollar-sign text-white"></i>
									</div>
								</div>
								<div class="ml-5 w-0 flex-1">
									<dl>
										<dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
											Total Cost
										</dt>
										<dd class="text-lg font-medium text-gray-900 dark:text-white">
											${(statistics.conversations?.totalCost || 0).toFixed(4)}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					{:else}
						<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="rounded-md bg-blue-500 p-3">
										<i class="fas fa-play text-white"></i>
									</div>
								</div>
								<div class="ml-5 w-0 flex-1">
									<dl>
										<dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
											Total Executions
										</dt>
										<dd class="text-lg font-medium text-gray-900 dark:text-white">
											{formatNumber(statistics.executions?.total || 0)}
										</dd>
									</dl>
								</div>
							</div>
						</div>

						<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="rounded-md bg-green-500 p-3">
										<i class="fas fa-check text-white"></i>
									</div>
								</div>
								<div class="ml-5 w-0 flex-1">
									<dl>
										<dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
											Success Rate
										</dt>
										<dd class="text-lg font-medium text-gray-900 dark:text-white">
											{(statistics.executions?.successRate || 0).toFixed(1)}%
										</dd>
									</dl>
								</div>
							</div>
						</div>

						<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="rounded-md bg-orange-500 p-3">
										<i class="fas fa-clock text-white"></i>
									</div>
								</div>
								<div class="ml-5 w-0 flex-1">
									<dl>
										<dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
											Avg Execution Time
										</dt>
										<dd class="text-lg font-medium text-gray-900 dark:text-white">
											{formatDuration(statistics.executions?.avgExecutionTime || 0)}
										</dd>
									</dl>
								</div>
							</div>
						</div>

						<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
							<div class="flex items-center">
								<div class="flex-shrink-0">
									<div class="rounded-md bg-red-500 p-3">
										<i class="fas fa-times text-white"></i>
									</div>
								</div>
								<div class="ml-5 w-0 flex-1">
									<dl>
										<dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
											Failed Executions
										</dt>
										<dd class="text-lg font-medium text-gray-900 dark:text-white">
											{formatNumber(statistics.executions?.failed || 0)}
										</dd>
									</dl>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Additional Statistics -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
						<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">
							{agent.type === 'chatbot' ? 'Conversation Statistics' : 'Execution Statistics'}
						</h3>
						<div class="space-y-4">
							{#if agent.type === 'chatbot'}
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600 dark:text-gray-400">Active Conversations</span>
									<span class="font-medium text-gray-900 dark:text-white">
										{statistics.conversations?.active || 0}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600 dark:text-gray-400"
										>Avg Messages per Conversation</span
									>
									<span class="font-medium text-gray-900 dark:text-white">
										{statistics.conversations?.avgMessagesPerConversation || '0.00'}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600 dark:text-gray-400">Total Tokens Used</span>
									<span class="font-medium text-gray-900 dark:text-white">
										{formatNumber(statistics.conversations?.totalTokens || 0)}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600 dark:text-gray-400"
										>Average Cost per Conversation</span
									>
									<span class="font-medium text-gray-900 dark:text-white">
										${(
											(statistics.conversations?.totalCost || 0) /
											Math.max(1, statistics.conversations?.total || 1)
										).toFixed(4)}
									</span>
								</div>
							{:else}
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600 dark:text-gray-400">Completed Executions</span>
									<span class="font-medium text-gray-900 dark:text-white">
										{statistics.executions?.completed || 0}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600 dark:text-gray-400">Failed Executions</span>
									<span class="font-medium text-gray-900 dark:text-white">
										{statistics.executions?.failed || 0}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600 dark:text-gray-400">Total Tool Calls</span>
									<span class="font-medium text-gray-900 dark:text-white">
										{formatNumber(statistics.executions?.totalToolCalls || 0)}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600 dark:text-gray-400">Total Cost</span>
									<span class="font-medium text-gray-900 dark:text-white">
										${(statistics.executions?.totalCost || 0).toFixed(4)}
									</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Recent Activity -->
					<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
						<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
						{#if statistics.recentActivity && statistics.recentActivity.length > 0}
							<div class="space-y-3">
								{#each statistics.recentActivity.slice(0, 5) as activity}
									<div
										class="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0 dark:border-gray-700"
									>
										<div class="flex items-center space-x-3">
											<div class="flex-shrink-0">
												{#if activity.status === 'success' || activity.status === 'completed'}
													<div class="h-2 w-2 rounded-full bg-green-500"></div>
												{:else if activity.status === 'failed'}
													<div class="h-2 w-2 rounded-full bg-red-500"></div>
												{:else}
													<div class="h-2 w-2 rounded-full bg-yellow-500"></div>
												{/if}
											</div>
											<div>
												<p class="text-sm font-medium capitalize text-gray-900 dark:text-white">
													{activity.type || 'Activity'}
												</p>
												<p class="text-xs text-gray-500 dark:text-gray-400">
													{formatDate(activity.timestamp)}
												</p>
											</div>
										</div>
										<div class="text-right">
											{#if activity.executionTime}
												<p class="text-sm font-medium text-gray-900 dark:text-white">
													{formatDuration(activity.executionTime)}
												</p>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="py-8 text-center">
								<div
									class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
								>
									<i class="fas fa-chart-line text-gray-400"></i>
								</div>
								<p class="text-sm text-gray-600 dark:text-gray-400">No recent activity</p>
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<div class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
					<div
						class="mx-auto mb-4 h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
					></div>
					<p class="text-gray-600 dark:text-gray-400">Loading statistics...</p>
				</div>
			{/if}
		{/if}

		<!-- End of Tab Content -->
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

	<!-- FAQ Configuration Modal -->
	{#if showFaqConfigModal}
		<ConfigureFaqModal {data} {agent} on:close={() => (showFaqConfigModal = false)} />
	{/if}

	<!-- RAG Configuration Modal -->
	{#if showRagConfigModal}
		<ConfigureRagModal {data} {agent} on:close={() => (showRagConfigModal = false)} />
	{/if}

	<!-- Web Search Configuration Modal -->
	{#if showWebSearchConfigModal}
		<ConfigureWebSearchModal {data} {agent} on:close={() => (showWebSearchConfigModal = false)} />
	{/if}

	<!-- Webpage Scraper Configuration Modal -->
	{#if showWebpageScraperConfigModal}
		<ConfigureWebpageScraperModal
			{data}
			{agent}
			on:close={() => (showWebpageScraperConfigModal = false)}
		/>
	{/if}

	<!-- Channels Configuration Modal -->
	{#if showChannelsConfigModal}
		<ConfigureChannelsModal
			{data}
			{agent}
			on:close={() => (showChannelsConfigModal = false)}
			on:saved={() => {
				showChannelsConfigModal = false;
				loadAgentData();
				loadEnabledChannels();
			}}
		/>
	{/if}

	<!-- View Conversation Modal -->
	{#if showViewConversationModal && selectedConversationId && agent}
		<ViewConversationModal
			{data}
			{agent}
			conversationId={selectedConversationId}
			on:close={() => {
				showViewConversationModal = false;
				selectedConversationId = null;
			}}
		/>
	{/if}
{/if}
