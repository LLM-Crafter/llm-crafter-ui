<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { api } from '$lib/api';

	export let data: any;
	export let agent: any;
	export let conversationId: string;
	
	const dispatch = createEventDispatcher();

	let messages: any[] = [];
	let loading = true;
	let conversation: any = null;

	function getToolIcon(toolId: string): string {
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
			case 'faq':
				return 'fas fa-question-circle';
			case 'rag_search':
				return 'fas fa-database';
			default:
				return 'fas fa-tools';
		}
	}

	function getToolColor(toolId: string): string {
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
			case 'faq':
				return 'text-cyan-400 bg-cyan-500/10';
			case 'rag_search':
				return 'text-orange-400 bg-orange-500/10';
			default:
				return 'text-indigo-400 bg-red-500/10';
		}
	}

	function formatTime(timestamp: Date | string): string {
		return new Date(timestamp).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDate(dateString: Date | string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	onMount(async () => {
		await loadConversation();
	});

	async function loadConversation() {
		try {
			loading = true;
			const response = await api.fetch(
				`/organizations/${data.organization_id}/projects/${data.project._id}/agents/${agent._id}/conversations/${conversationId}`
			);
			
			if (response.ok) {
				conversation = await response.json();
				messages = conversation.messages || [];
			}
		} catch (error) {
			console.error('Failed to load conversation:', error);
		} finally {
			loading = false;
		}
	}
</script>

<!-- Modal Backdrop -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
	on:click|self={() => dispatch('close')}
>
	<!-- Modal Content -->
	<div
		class="flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-lg border border-gray-800 bg-gray-900 shadow-xl"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-800 p-4">
			<div class="flex items-center space-x-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
				>
					<i class="fas fa-comments text-white"></i>
				</div>
				<div>
					<h2 class="text-lg font-bold text-white">{agent.name} - Conversation</h2>
					{#if conversation}
						<p class="text-sm text-gray-400">
							Started: {formatDate(conversation.createdAt)} • 
							{messages.length} messages • 
							${conversation.metadata?.total_cost || '0.0000'} cost
						</p>
					{:else}
						<p class="text-sm text-gray-400">View conversation history</p>
					{/if}
				</div>
			</div>
			<button
				on:click={() => dispatch('close')}
				class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-300"
				aria-label="Close modal"
			>
				<i class="fas fa-times"></i>
			</button>
		</div>

		<!-- Messages Container -->
		<div class="flex-1 space-y-4 overflow-y-auto p-4">
			{#if loading}
				<div class="py-8 text-center">
					<div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
					<p class="text-gray-400">Loading conversation...</p>
				</div>
			{:else if messages.length === 0}
				<div class="py-8 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-500/10"
					>
						<i class="fas fa-comments text-2xl text-gray-400"></i>
					</div>
					<h3 class="mb-2 text-lg font-medium text-gray-300">No messages found</h3>
					<p class="text-gray-400">This conversation doesn't have any messages yet.</p>
				</div>
			{:else}
				{#each messages as message}
					<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
						<div class="max-w-[70%]">
							{#if message.role === 'user'}
								<div class="rounded-lg bg-indigo-600 px-4 py-2 text-white">
									<p class="whitespace-pre-wrap">{message.content}</p>
									{#if message.context}
										<div class="mt-2 rounded bg-indigo-700/50 px-3 py-2">
											<div class="mb-1 flex items-center space-x-1">
												<i class="fas fa-cog text-xs"></i>
												<span class="text-xs font-medium">Context provided</span>
											</div>
										</div>
									{/if}
									<p class="mt-1 text-xs text-indigo-200">{formatTime(message.timestamp)}</p>
								</div>
							{:else if message.role === 'assistant'}
								<div class="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2">
									<div class="mb-2 flex items-center space-x-2">
										<div
											class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
										>
											<i class="fas fa-robot text-xs text-white"></i>
										</div>
										<span class="text-sm font-medium text-gray-300">{agent.name}</span>
										<span class="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
									</div>

									<div class="mb-2 whitespace-pre-wrap text-gray-100">{message.content}</div>

									{#if message.thinking}
										<details class="mt-2">
											<summary class="cursor-pointer text-xs text-gray-400 hover:text-gray-300">
												View thinking process
											</summary>
											<div
												class="mt-2 whitespace-pre-wrap rounded bg-gray-700/50 p-3 text-xs text-gray-300"
											>
												{message.thinking}
											</div>
										</details>
									{/if}

									{#if message.tools_used && message.tools_used.length > 0}
										<div class="mt-2 flex flex-wrap gap-1">
											{#each message.tools_used.map((tool) => tool.tool_name) as tool}
												<span
													class="inline-flex items-center rounded-md {getToolColor(
														tool
													)} px-2 py-1 text-xs font-medium"
												>
													<i class="{getToolIcon(tool)} mr-1"></i>
													{tool}
												</span>
											{/each}
										</div>
									{/if}
								</div>
							{:else if message.role === 'error'}
								<div class="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2">
									<div class="mb-1 flex items-center space-x-2">
										<i class="fas fa-exclamation-triangle text-red-400"></i>
										<span class="text-sm font-medium text-red-400">Error</span>
									</div>
									<p class="text-red-300">{message.content}</p>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Footer with conversation metadata -->
		{#if conversation && !loading}
			<div class="border-t border-gray-800 bg-gray-800/50 px-4 py-3">
				<div class="flex items-center justify-between text-sm text-gray-400">
					<div class="flex items-center space-x-4">
						<span>
							<i class="fas fa-calendar mr-1"></i>
							{formatDate(conversation.createdAt)}
						</span>
						{#if conversation.updatedAt}
							<span>
								<i class="fas fa-clock mr-1"></i>
								Last activity: {formatDate(conversation.updatedAt)}
							</span>
						{/if}
					</div>
					<div class="flex items-center space-x-4">
						<span>
							<i class="fas fa-comments mr-1"></i>
							{messages.length} messages
						</span>
						{#if conversation.metadata?.total_cost}
							<span class="font-medium text-green-400">
								<i class="fas fa-dollar-sign mr-1"></i>
								${conversation.metadata.total_cost}
							</span>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
