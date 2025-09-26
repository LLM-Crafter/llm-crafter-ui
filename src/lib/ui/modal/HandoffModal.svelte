<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { api } from '$lib/api';

	export let conversationId: string;
	export let data: any; // Organization and project data
	const dispatch = createEventDispatcher();

	let conversation: any = null;
	let loading = true;
	let error = '';
	let currentMessage = '';
	let sending = false;
	let isStreaming = false;

	// Real-time updates
	let eventSource: EventSource | null = null;
	let pollInterval: NodeJS.Timeout | null = null;
	let isPolling = false;
	let lastMessageTimestamp = null;

	onMount(async () => {
		await loadConversation();
		setupRealTimeUpdates();
		startPollingForNewMessages();
	});

	onDestroy(() => {
		if (eventSource) {
			eventSource.close();
		}
		stopPollingForNewMessages();
	});

	async function loadConversation() {
		try {
			loading = true;
			const response = await api.getHandoffConversation(conversationId);
			conversation = response.conversation;
		} catch (err) {
			error = err.message || 'Failed to load conversation';
		} finally {
			loading = false;
		}
	}

	function setupRealTimeUpdates() {
		try {
			const token = localStorage.getItem('token');
			if (!token) return;

			// Create EventSource with auth header (note: EventSource doesn't support custom headers directly)
			// We'll need to pass the token as a query parameter or use a different approach
			const url = `/api/v1/handoffs/conversations/${conversationId}/stream?token=${encodeURIComponent(token)}`;
			eventSource = new EventSource(url);

			eventSource.onopen = () => {
				console.log('Handoff stream connected');
			};

			eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					handleStreamEvent(data);
				} catch (err) {
					console.error('Failed to parse stream data:', err);
				}
			};

			eventSource.onerror = (err) => {
				console.error('Handoff stream error:', err);
			};
		} catch (err) {
			console.error('Failed to setup real-time updates:', err);
		}
	}

	function handleStreamEvent(data: any) {
		if (data.type === 'new_messages' && data.messages) {
			// Add new messages to conversation
			if (conversation) {
				let updatedMessages = [...conversation.messages];
				let hasUpdates = false;
				
				for (const newMsg of data.messages) {
					// Check if this message replaces a temporary message
					const tempMessageIndex = updatedMessages.findIndex(msg => 
						msg.tempId && 
						msg.content === newMsg.content && 
						msg.role === newMsg.role &&
						Math.abs(new Date(msg.timestamp).getTime() - new Date(newMsg.timestamp).getTime()) < 5000 // Within 5 seconds
					);
					
					if (tempMessageIndex !== -1) {
						// Replace temporary message with real message
						updatedMessages[tempMessageIndex] = newMsg;
						hasUpdates = true;
					} else {
						// Check if this is a duplicate (already exists without tempId)
						const isDuplicate = updatedMessages.some(existingMsg => 
							!existingMsg.tempId &&
							existingMsg.content === newMsg.content && 
							existingMsg.role === newMsg.role &&
							Math.abs(new Date(existingMsg.timestamp).getTime() - new Date(newMsg.timestamp).getTime()) < 1000
						);
						
						if (!isDuplicate) {
							// Add new message
							updatedMessages.push(newMsg);
							hasUpdates = true;
						}
					}
				}
				
				if (hasUpdates) {
					conversation.messages = updatedMessages;
					// Update last message timestamp
					if (data.messages.length > 0) {
						lastMessageTimestamp = data.messages[data.messages.length - 1].timestamp;
					}
					conversation = { ...conversation }; // Trigger reactivity
				}
			}
		} else if (data.type === 'status_update') {
			// Update conversation status
			if (conversation) {
				conversation.status = data.conversation_status;
				conversation.current_handler = data.current_handler;
				conversation = { ...conversation }; // Trigger reactivity
			}
		}
	}

	function startPollingForNewMessages() {
		if (isPolling || !conversationId) return;
		
		isPolling = true;
		
		// Set initial timestamp from loaded conversation
		if (conversation?.messages && conversation.messages.length > 0) {
			lastMessageTimestamp = conversation.messages[conversation.messages.length - 1].timestamp;
		}
		
		const poll = async () => {
			try {
				const response = await api.getLatestMessages(conversationId, lastMessageTimestamp);
				
				// Check for new messages
				if (response.new_messages && response.new_messages.length > 0) {
					if (conversation) {
						let updatedMessages = [...conversation.messages];
						let hasUpdates = false;
						
						for (const newMsg of response.new_messages) {
							// Check if this message replaces a temporary message
							const tempMessageIndex = updatedMessages.findIndex(msg => 
								msg.tempId && 
								msg.content === newMsg.content && 
								msg.role === newMsg.role &&
								Math.abs(new Date(msg.timestamp).getTime() - new Date(newMsg.timestamp).getTime()) < 5000 // Within 5 seconds
							);
							
							if (tempMessageIndex !== -1) {
								// Replace temporary message with real message
								updatedMessages[tempMessageIndex] = newMsg;
								hasUpdates = true;
							} else {
								// Check if this is a duplicate (already exists without tempId)
								const isDuplicate = updatedMessages.some(existingMsg => 
									!existingMsg.tempId &&
									existingMsg.content === newMsg.content && 
									existingMsg.role === newMsg.role &&
									Math.abs(new Date(existingMsg.timestamp).getTime() - new Date(newMsg.timestamp).getTime()) < 1000
								);
								
								if (!isDuplicate) {
									// Add new message
									updatedMessages.push(newMsg);
									hasUpdates = true;
								}
							}
						}
						
						if (hasUpdates) {
							conversation.messages = updatedMessages;
							// Update last message timestamp
							lastMessageTimestamp = response.new_messages[response.new_messages.length - 1].timestamp;
							// Trigger reactivity
							conversation = { ...conversation };
						}
					}
				}
				
				// Check for status changes
				if (response.conversation_status && conversation) {
					if (conversation.status !== response.conversation_status) {
						conversation.status = response.conversation_status;
						conversation.current_handler = response.current_handler;
						conversation = { ...conversation };
					}
				}
				
			} catch (error) {
				console.error('Polling error in HandoffModal:', error);
				// Continue polling even on error to recover from temporary issues
			}
		};
		
		// Poll every 2 seconds for new messages
		pollInterval = setInterval(poll, 2000);
		
		// Also poll immediately once
		poll();
	}

	function stopPollingForNewMessages() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
		isPolling = false;
	}

	// Auto-scroll functionality
	let messagesContainer: HTMLElement;

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTo({
				top: messagesContainer.scrollHeight,
				behavior: 'smooth'
			});
		}
	}

	// Auto-scroll when conversation messages change
	$: if (conversation?.messages && conversation.messages.length > 0) {
		// Use a small delay to ensure DOM is updated
		setTimeout(scrollToBottom, 10);
	}

	async function takeoverConversation() {
		try {
			sending = true;
			const message = currentMessage.trim() || undefined;
			
			// If there's a message, add it to UI immediately
			if (message && conversation) {
				const takeoverMessage = {
					role: 'human_operator',
					content: message,
					timestamp: new Date().toISOString(),
					handler_info: {
						human_operator: {
							name: 'You',
							user_id: 'current_user'
						}
					}
				};
				
				conversation.messages = [...conversation.messages, takeoverMessage];
				conversation = { ...conversation }; // Trigger reactivity
				currentMessage = '';
			}
			
			await api.takeoverConversation(conversationId, message);
			await loadConversation(); // Reload to get updated status
		} catch (err) {
			error = err.message || 'Failed to takeover conversation';
			// Remove the optimistically added message on error
			if (message && conversation && conversation.messages.length > 0) {
				const lastMessage = conversation.messages[conversation.messages.length - 1];
				if (lastMessage.content === message && lastMessage.role === 'human_operator') {
					conversation.messages = conversation.messages.slice(0, -1);
					conversation = { ...conversation }; // Trigger reactivity
				}
			}
		} finally {
			sending = false;
		}
	}

	async function sendMessage() {
		if (!currentMessage.trim() || sending) return;

		const messageText = currentMessage;
		
		try {
			sending = true;
			
			// Immediately add the message to UI for instant feedback
			const tempId = `temp-${Date.now()}-${Math.random()}`;
			const userMessage = {
				role: 'human_operator',
				content: messageText,
				timestamp: new Date().toISOString(),
				tempId: tempId, // Mark as temporary
				handler_info: {
					human_operator: {
						name: 'You',
						user_id: 'current_user'
					}
				}
			};
			
			// Add to conversation messages
			if (conversation) {
				conversation.messages = [...conversation.messages, userMessage];
				conversation = { ...conversation }; // Trigger reactivity
			}
			
			currentMessage = '';
			
			// Send to backend
			await api.sendHandoffMessage(conversationId, messageText);
			
			// Message will be replaced by the real message via real-time updates
		} catch (err) {
			error = err.message || 'Failed to send message';
			// Remove the optimistically added message on error
			if (conversation && conversation.messages.length > 0) {
				const lastMessage = conversation.messages[conversation.messages.length - 1];
				if (lastMessage.content === messageText && lastMessage.role === 'human_operator') {
					conversation.messages = conversation.messages.slice(0, -1);
					conversation = { ...conversation }; // Trigger reactivity
				}
			}
		} finally {
			sending = false;
		}
	}

	async function handbackToAgent() {
		try {
			sending = true;
			await api.handbackToAgent(conversationId);
			await loadConversation(); // Reload to get updated status
		} catch (err) {
			error = err.message || 'Failed to hand back to agent';
		} finally {
			sending = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			if (conversation?.current_handler === 'human') {
				sendMessage();
			} else {
				takeoverConversation();
			}
		}
	}

	function formatTime(timestamp: string) {
		return new Date(timestamp).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getUrgencyColor(urgency: string) {
		switch (urgency) {
			case 'high': return 'text-red-400 bg-red-500/10';
			case 'medium': return 'text-yellow-400 bg-yellow-500/10';
			case 'low': return 'text-green-400 bg-green-500/10';
			default: return 'text-gray-400 bg-gray-500/10';
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
</script>

<!-- Modal Backdrop -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
	<div class="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-gray-900 shadow-2xl">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-800 p-6">
			<div class="flex items-center space-x-4">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
					<i class="fas fa-users text-white"></i>
				</div>
				<div>
					<h2 class="text-xl font-bold text-white">Conversation Handoff</h2>
					<p class="text-sm text-gray-400">ID: {conversationId}</p>
				</div>
				
				{#if conversation}
					<div class="flex items-center space-x-2">
						<span class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium {getStatusColor(conversation.status)}">
							{conversation.status.replace('_', ' ')}
						</span>
						
						{#if conversation.handoff_info?.urgency}
							<span class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium {getUrgencyColor(conversation.handoff_info.urgency)}">
								{conversation.handoff_info.urgency} urgency
							</span>
						{/if}
					</div>
				{/if}
			</div>
			
			<button
				on:click={() => dispatch('close')}
				class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-300"
			>
				<i class="fas fa-times"></i>
			</button>
		</div>

		{#if loading}
			<div class="flex items-center justify-center p-12">
				<div class="text-center">
					<div class="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-r-transparent"></div>
					<p class="text-gray-400">Loading conversation...</p>
				</div>
			</div>
		{:else if error}
			<div class="p-6">
				<div class="rounded-lg border border-red-300 bg-red-500/10 p-4 text-red-400">
					<i class="fas fa-exclamation-triangle mr-2"></i>
					{error}
				</div>
			</div>
		{:else if conversation}
			<div class="flex h-[600px]">
				<!-- Conversation Info Sidebar -->
				<div class="w-80 border-r border-gray-800 p-6 overflow-y-auto">
					<div class="space-y-6">
						<!-- Agent Info -->
						<div>
							<h3 class="mb-2 text-sm font-medium text-gray-300">Agent</h3>
							<div class="rounded-lg border border-gray-700 bg-gray-800 p-3">
								<p class="font-medium text-gray-100">{conversation.agent.name}</p>
								<p class="text-sm text-gray-400">{conversation.agent.type}</p>
							</div>
						</div>

						<!-- User Info -->
						<div>
							<h3 class="mb-2 text-sm font-medium text-gray-300">User</h3>
							<div class="rounded-lg border border-gray-700 bg-gray-800 p-3">
								<p class="text-gray-100">{conversation.user_identifier}</p>
							</div>
						</div>

						<!-- Handoff Info -->
						{#if conversation.handoff_info}
							<div>
								<h3 class="mb-2 text-sm font-medium text-gray-300">Handoff Details</h3>
								<div class="space-y-3 rounded-lg border border-gray-700 bg-gray-800 p-3">
									<div>
										<p class="text-xs text-gray-400">Reason</p>
										<p class="text-sm text-gray-100">{conversation.handoff_info.reason}</p>
									</div>
									
									{#if conversation.handoff_info.handoff_message}
										<div>
											<p class="text-xs text-gray-400">Context</p>
											<p class="text-sm text-gray-100">{conversation.handoff_info.handoff_message}</p>
										</div>
									{/if}
									
									<div>
										<p class="text-xs text-gray-400">Requested At</p>
										<p class="text-sm text-gray-100">{formatTime(conversation.handoff_info.requested_at)}</p>
									</div>
								</div>
							</div>
						{/if}

						<!-- Actions -->
						<div class="space-y-3">
							{#if conversation.current_handler === 'agent' && conversation.status === 'handoff_requested'}
								<button
									on:click={takeoverConversation}
									disabled={sending}
									class="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
								>
									{#if sending}
										<i class="fas fa-spinner fa-spin mr-2"></i>
									{/if}
									Take Over Conversation
								</button>
							{:else if conversation.current_handler === 'human'}
								<button
									on:click={handbackToAgent}
									disabled={sending}
									class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600 disabled:opacity-50"
								>
									{#if sending}
										<i class="fas fa-spinner fa-spin mr-2"></i>
									{/if}
									Hand Back to Agent
								</button>
							{/if}
						</div>
					</div>
				</div>

				<!-- Chat Interface -->
				<div class="flex flex-1 flex-col">
					<!-- Messages -->
					<div bind:this={messagesContainer} class="flex-1 overflow-y-auto p-6">
						<div class="space-y-4">
							{#each conversation.messages as message, index}
								<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
									<div class="max-w-xs lg:max-w-md">
										{#if message.role === 'user'}
											<div class="rounded-lg bg-indigo-600 p-3 text-white">
												<p class="text-sm">{message.content}</p>
												<p class="mt-1 text-xs text-indigo-200">{formatTime(message.timestamp)}</p>
											</div>
										{:else if message.role === 'assistant'}
											<div class="rounded-lg border border-gray-700 bg-gray-800 p-3">
												<p class="text-sm text-gray-100">{message.content}</p>
												<div class="mt-1 flex items-center justify-between">
													<p class="text-xs text-gray-400">{formatTime(message.timestamp)}</p>
													<span class="text-xs text-blue-400">AI Agent</span>
												</div>
											</div>
										{:else if message.role === 'human_operator'}
											<div class="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
												<p class="text-sm text-gray-100">{message.content}</p>
												<div class="mt-1 flex items-center justify-between">
													<p class="text-xs text-gray-400">{formatTime(message.timestamp)}</p>
													{#if message.handler_info?.human_operator}
														<span class="text-xs text-green-400">{message.handler_info.human_operator.name}</span>
													{:else}
														<span class="text-xs text-green-400">Human Operator</span>
													{/if}
												</div>
											</div>
										{:else if message.role === 'system'}
											<div class="rounded-lg bg-gray-700/50 p-3 text-center">
												<p class="text-xs text-gray-400">{message.content}</p>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Message Input -->
					<div class="border-t border-gray-800 p-6">
						{#if conversation.current_handler === 'human'}
							<div class="flex space-x-4">
								<input
									type="text"
									bind:value={currentMessage}
									on:keypress={handleKeyPress}
									placeholder="Type your message..."
									disabled={sending}
									class="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
								/>
								<button
									on:click={sendMessage}
									disabled={!currentMessage.trim() || sending}
									class="rounded-lg bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
								>
									{#if sending}
										<i class="fas fa-spinner fa-spin"></i>
									{:else}
										<i class="fas fa-paper-plane"></i>
									{/if}
								</button>
							</div>
						{:else}
							<div class="flex space-x-4">
								<input
									type="text"
									bind:value={currentMessage}
									on:keypress={handleKeyPress}
									placeholder="Type initial message (optional) and press Enter to take over..."
									disabled={sending}
									class="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
								/>
								<button
									on:click={takeoverConversation}
									disabled={sending}
									class="rounded-lg bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
								>
									{#if sending}
										<i class="fas fa-spinner fa-spin"></i>
									{:else}
										<i class="fas fa-hand-paper"></i>
									{/if}
								</button>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
