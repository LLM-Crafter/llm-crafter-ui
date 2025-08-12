<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { api } from '$lib/api';

	export let data;
	export let agent;
	const dispatch = createEventDispatcher();

	let messages = [];
	let currentMessage = '';
	let loading = false;
	let conversationId = null;

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
				return 'text-green-400 bg-green-500/10';
		}
	}

	async function sendMessage() {
		if (!currentMessage.trim() || loading) return;

		const userMessage = {
			role: 'user',
			content: currentMessage,
			timestamp: new Date()
		};

		messages = [...messages, userMessage];
		const messageToSend = currentMessage;
		currentMessage = '';
		loading = true;

		try {
			const response = await api.chatWithAgent(data.organization_id, data.project._id, agent._id, {
				message: messageToSend,
				user_identifier: 'user-123', // In a real app, this would be the actual user ID
				conversation_id: conversationId
			});

			if (response.conversation_id && !conversationId) {
				conversationId = response.conversation_id;
			}

			const botMessage = {
				role: 'assistant',
				content: response.response,
				timestamp: new Date(),
				thinking: response.thinking,
				tools_used: response.tools_used
			};

			messages = [...messages, botMessage];
		} catch (error) {
			console.error('Failed to send message:', error);
			const errorMessage = {
				role: 'error',
				content: 'Failed to get response from agent. Please try again.',
				timestamp: new Date()
			};
			messages = [...messages, errorMessage];
		} finally {
			loading = false;
		}
	}

	function handleKeyPress(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function formatTime(timestamp) {
		return new Date(timestamp).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<!-- BACKDROP -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
	<!-- MODAL -->
	<div
		class="mx-4 flex h-[80vh] w-full max-w-4xl flex-col rounded-xl border border-gray-800 bg-gray-900 shadow-2xl"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-800 p-4">
			<div class="flex items-center space-x-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500"
				>
					<i class="fas fa-comments text-white"></i>
				</div>
				<div>
					<h2 class="text-lg font-bold text-white">{agent.name}</h2>
					<p class="text-sm text-gray-400">Chat with AI Agent</p>
				</div>
			</div>
			<button
				on:click={() => dispatch('close')}
				class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-300"
			>
				<i class="fas fa-times"></i>
			</button>
		</div>

		<!-- Messages Container -->
		<div class="flex-1 space-y-4 overflow-y-auto p-4">
			{#if messages.length === 0}
				<div class="py-8 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10"
					>
						<i class="fas fa-comments text-2xl text-blue-400"></i>
					</div>
					<h3 class="mb-2 text-lg font-medium text-gray-300">Start a conversation</h3>
					<p class="text-gray-400">Send a message to begin chatting with {agent.name}</p>
				</div>
			{:else}
				{#each messages as message}
					<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
						<div class="max-w-[70%]">
							{#if message.role === 'user'}
								<div class="rounded-lg bg-indigo-600 px-4 py-2 text-white">
									<p class="whitespace-pre-wrap">{message.content}</p>
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

			{#if loading}
				<div class="flex justify-start">
					<div class="max-w-[70%] rounded-lg border border-gray-700 bg-gray-800 px-4 py-2">
						<div class="flex items-center space-x-2">
							<div
								class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
							>
								<i class="fas fa-robot text-xs text-white"></i>
							</div>
							<span class="text-sm font-medium text-gray-300">{agent.name} is thinking...</span>
							<div class="flex space-x-1">
								<div class="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
								<div
									class="h-2 w-2 animate-bounce rounded-full bg-gray-400"
									style="animation-delay: 0.1s"
								></div>
								<div
									class="h-2 w-2 animate-bounce rounded-full bg-gray-400"
									style="animation-delay: 0.2s"
								></div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Input Area -->
		<div class="border-t border-gray-800 p-4">
			<div class="flex items-end space-x-3">
				<div class="flex-1">
					<textarea
						bind:value={currentMessage}
						on:keydown={handleKeyPress}
						placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
						rows="1"
						disabled={loading}
						class="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
						style="min-height: 44px; max-height: 120px;"
					></textarea>
				</div>
				<button
					on:click={sendMessage}
					disabled={!currentMessage.trim() || loading}
					class="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading}
						<i class="fas fa-spinner fa-spin"></i>
					{:else}
						<i class="fas fa-paper-plane"></i>
					{/if}
				</button>
			</div>

			{#if conversationId}
				<p class="mt-2 text-xs text-gray-500">
					Conversation ID: {conversationId}
				</p>
			{/if}
		</div>
	</div>
</div>
