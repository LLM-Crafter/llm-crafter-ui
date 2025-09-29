<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/api';
	import HandoffModal from '$lib/ui/modal/HandoffModal.svelte';

	export let data;

	let pendingHandoffs = [];
	let myConversations = [];
	let loading = true;
	let error = '';
	let activeTab = 'pending';
	let selectedConversationId = null;
	let showHandoffModal = false;

	// Pagination
	let currentPage = 1;
	let totalPages = 1;
	let itemsPerPage = 20;

	// Filters
	let urgencyFilter = '';

	// Auto-refresh
	let refreshInterval: NodeJS.Timeout;

	onMount(async () => {
		await loadData();
		// Refresh every 30 seconds
		refreshInterval = setInterval(loadData, 30000);
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	async function loadData() {
		try {
			loading = true;
			await Promise.all([loadPendingHandoffs(), loadMyConversations()]);
		} catch (err) {
			error = err.message || 'Failed to load handoff data';
		} finally {
			loading = false;
		}
	}

	async function loadPendingHandoffs() {
		const params: any = {
			page: currentPage,
			limit: itemsPerPage
		};
		
		if (urgencyFilter) {
			params.urgency = urgencyFilter;
		}

		const response = await api.getPendingHandoffs(params);
		pendingHandoffs = response.conversations;
		
		if (response.pagination) {
			totalPages = response.pagination.pages;
		}
	}

	async function loadMyConversations() {
		const response = await api.getMyConversations({
			page: currentPage,
			limit: itemsPerPage
		});
		myConversations = response.conversations;
	}

	function openHandoffModal(conversationId: string) {
		selectedConversationId = conversationId;
		showHandoffModal = true;
	}

	function closeHandoffModal() {
		showHandoffModal = false;
		selectedConversationId = null;
		// Refresh data when modal closes
		loadData();
	}

	async function changePage(page: number) {
		currentPage = page;
		await loadData();
	}

	async function changeUrgencyFilter() {
		currentPage = 1; // Reset to first page when filtering
		await loadPendingHandoffs();
	}

	function formatTime(timestamp: string) {
		return new Date(timestamp).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDate(timestamp: string) {
		return new Date(timestamp).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getUrgencyColor(urgency: string) {
		switch (urgency) {
			case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
			case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
			case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
			default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'handoff_requested': return 'text-orange-400 bg-orange-500/10';
			case 'human_controlled': return 'text-blue-400 bg-blue-500/10';
			case 'agent_controlled': return 'text-green-400 bg-green-500/10';
			default: return 'text-gray-400 bg-gray-500/10';
		}
	}

	function truncateText(text: string, maxLength: number = 100) {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}
</script>

<svelte:head>
	<title>Handoff Management - LLM Crafter</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<!-- Header -->
	<div class="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
						<i class="fas fa-users text-white"></i>
					</div>
					<div>
						<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
							Human Handoff Management
						</h1>
						<p class="text-gray-600 dark:text-gray-400">
							Monitor and manage conversations requiring human intervention
						</p>
					</div>
				</div>
				
				<div class="flex items-center space-x-4">
					<button
						on:click={loadData}
						disabled={loading}
						class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						<i class="fas fa-sync-alt mr-2 {loading ? 'animate-spin' : ''}"></i>
						Refresh
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Tabs -->
	<div class="border-b border-gray-200 dark:border-gray-800">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<nav class="-mb-px flex space-x-8">
				<button
					on:click={() => activeTab = 'pending'}
					class="whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium {activeTab === 'pending'
						? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
				>
					<i class="fas fa-clock mr-2"></i>
					Pending Handoffs
					{#if pendingHandoffs.length > 0}
						<span class="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
							{pendingHandoffs.length}
						</span>
					{/if}
				</button>
				
				<button
					on:click={() => activeTab = 'my-conversations'}
					class="whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium {activeTab === 'my-conversations'
						? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
				>
					<i class="fas fa-user mr-2"></i>
					My Conversations
					{#if myConversations.length > 0}
						<span class="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
							{myConversations.length}
						</span>
					{/if}
				</button>
			</nav>
		</div>
	</div>

	<!-- Content -->
	<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
		{#if error}
			<div class="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
				<div class="flex">
					<i class="fas fa-exclamation-triangle text-red-400"></i>
					<div class="ml-3">
						<p class="text-sm text-red-800 dark:text-red-200">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Pending Handoffs Tab -->
		{#if activeTab === 'pending'}
			<div class="space-y-6">
				<!-- Filters -->
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-4">
						<select
							bind:value={urgencyFilter}
							on:change={changeUrgencyFilter}
							class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
						>
							<option value="">All Urgencies</option>
							<option value="high">High</option>
							<option value="medium">Medium</option>
							<option value="low">Low</option>
						</select>
					</div>
				</div>

				<!-- Pending Handoffs List -->
				<div class="space-y-4">
					{#if loading}
						<div class="text-center py-12">
							<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-r-transparent"></div>
							<p class="mt-2 text-gray-600 dark:text-gray-400">Loading handoffs...</p>
						</div>
					{:else if pendingHandoffs.length === 0}
						<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
							<i class="fas fa-inbox text-4xl text-gray-400"></i>
							<h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No pending handoffs</h3>
							<p class="mt-2 text-gray-600 dark:text-gray-400">
								All conversations are running smoothly with AI agents
							</p>
						</div>
					{:else}
						{#each pendingHandoffs as conversation}
							<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="flex items-center space-x-3 mb-3">
											<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
												{conversation.title || `Conversation with ${conversation.user_identifier}`}
											</h3>
											
											{#if conversation.handoff_info?.urgency}
												<span class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium {getUrgencyColor(conversation.handoff_info.urgency)}">
													{conversation.handoff_info.urgency} priority
												</span>
											{/if}
											
											<span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium {getStatusColor(conversation.status)}">
												{conversation.status.replace('_', ' ')}
											</span>
										</div>
										
										<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
											<div>
												<span class="text-gray-500 dark:text-gray-400">Agent:</span>
												<span class="ml-1 text-gray-900 dark:text-gray-100">{conversation.agent.name}</span>
											</div>
											<div>
												<span class="text-gray-500 dark:text-gray-400">User:</span>
												<span class="ml-1 text-gray-900 dark:text-gray-100">{conversation.user_identifier}</span>
											</div>
											<div>
												<span class="text-gray-500 dark:text-gray-400">Requested:</span>
												<span class="ml-1 text-gray-900 dark:text-gray-100">{formatDate(conversation.handoff_info?.requested_at)}</span>
											</div>
											<div>
												<span class="text-gray-500 dark:text-gray-400">Messages:</span>
												<span class="ml-1 text-gray-900 dark:text-gray-100">{conversation.messages?.length || 0}</span>
											</div>
										</div>
										
										{#if conversation.handoff_info?.reason}
											<div class="mt-3">
												<span class="text-gray-500 dark:text-gray-400 text-sm">Reason:</span>
												<p class="mt-1 text-gray-900 dark:text-gray-100">{truncateText(conversation.handoff_info.reason)}</p>
											</div>
										{/if}
									</div>
									
									<button
										on:click={() => openHandoffModal(conversation._id)}
										class="ml-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
									>
										<i class="fas fa-hand-paper mr-2"></i>
										Take Over
									</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/if}

		<!-- My Conversations Tab -->
		{#if activeTab === 'my-conversations'}
			<div class="space-y-4">
				{#if loading}
					<div class="text-center py-12">
						<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-r-transparent"></div>
						<p class="mt-2 text-gray-600 dark:text-gray-400">Loading conversations...</p>
					</div>
				{:else if myConversations.length === 0}
					<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
						<i class="fas fa-comments text-4xl text-gray-400"></i>
						<h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No active conversations</h3>
						<p class="mt-2 text-gray-600 dark:text-gray-400">
							You don't have any conversations under your control
						</p>
					</div>
				{:else}
					{#each myConversations as conversation}
						<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="flex items-center space-x-3 mb-3">
										<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
											{conversation.title || `Conversation with ${conversation.user_identifier}`}
										</h3>
										
										<span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium {getStatusColor(conversation.status)}">
											{conversation.status.replace('_', ' ')}
										</span>
									</div>
									
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
										<div>
											<span class="text-gray-500 dark:text-gray-400">Agent:</span>
											<span class="ml-1 text-gray-900 dark:text-gray-100">{conversation.agent.name}</span>
										</div>
										<div>
											<span class="text-gray-500 dark:text-gray-400">User:</span>
											<span class="ml-1 text-gray-900 dark:text-gray-100">{conversation.user_identifier}</span>
										</div>
										<div>
											<span class="text-gray-500 dark:text-gray-400">Taken over:</span>
											<span class="ml-1 text-gray-900 dark:text-gray-100">{formatDate(conversation.handoff_info?.handed_off_at)}</span>
										</div>
										<div>
											<span class="text-gray-500 dark:text-gray-400">Messages:</span>
											<span class="ml-1 text-gray-900 dark:text-gray-100">{conversation.messages?.length || 0}</span>
										</div>
									</div>
								</div>
								
								<button
									on:click={() => openHandoffModal(conversation._id)}
									class="ml-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<i class="fas fa-comments mr-2"></i>
									Continue
								</button>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="mt-8 flex items-center justify-center">
				<nav class="inline-flex rounded-md shadow-sm">
					<button
						on:click={() => changePage(currentPage - 1)}
						disabled={currentPage === 1}
						class="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
					>
						<i class="fas fa-chevron-left"></i>
					</button>
					
					{#each Array(totalPages) as _, i}
						<button
							on:click={() => changePage(i + 1)}
							class="relative inline-flex items-center border px-4 py-2 text-sm font-medium {currentPage === i + 1
								? 'bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400'
								: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}"
						>
							{i + 1}
						</button>
					{/each}
					
					<button
						on:click={() => changePage(currentPage + 1)}
						disabled={currentPage === totalPages}
						class="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
					>
						<i class="fas fa-chevron-right"></i>
					</button>
				</nav>
			</div>
		{/if}
	</div>
</div>

<!-- Handoff Modal -->
{#if showHandoffModal && selectedConversationId}
	<HandoffModal
		conversationId={selectedConversationId}
		{data}
		on:close={closeHandoffModal}
	/>
{/if}
