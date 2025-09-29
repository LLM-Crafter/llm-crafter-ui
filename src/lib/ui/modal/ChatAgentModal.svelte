<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { api } from '$lib/api';

	export let data;
	export let agent;
	const dispatch = createEventDispatcher();

	let messages = [];
	let currentMessage = '';
	let loading = false;
	let conversationId = null;
	let showContextForm = false;
	let contextInput = '';
	let contextError = '';
	let currentSuggestions = []; // Track current suggestions to display
	let isStreaming = false;
	let streamingResponse = '';
	let streamingMessageIndex = -1;

	// Chat states according to documentation
	const ChatStates = {
		NORMAL_CHAT: 'normal_chat',
		WAITING_FOR_HUMAN: 'waiting_human',
		HUMAN_ACTIVE: 'human_active',
		RECONNECTING: 'reconnecting'
	};

	// Enhanced handoff state
	let chatState = ChatStates.NORMAL_CHAT;
	let conversationStatus = 'agent_controlled';
	let currentHandler = 'agent';
	let handoffInfo = null;
	let humanOperator = null;
	let isPolling = false;
	let pollInterval = null;
	let humanStream = null;
	let lastMessageTimestamp = null;

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
			case 'faq':
				return 'fas fa-question-circle';
			case 'rag_search':
				return 'fas fa-database';
			case 'request_human_handoff':
				return 'fas fa-hand-paper';
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
			case 'faq':
				return 'text-cyan-400 bg-cyan-500/10';
			case 'rag_search':
				return 'text-orange-400 bg-orange-500/10';
			case 'request_human_handoff':
				return 'text-indigo-400 bg-indigo-500/10';
			default:
				return 'text-indigo-400 bg-red-500/10';
		}
	}

	async function sendMessage() {
		if (!currentMessage.trim() || loading || isStreaming) return;

		// Don't send if waiting for human connection or reconnecting
		if (chatState === ChatStates.WAITING_FOR_HUMAN || chatState === ChatStates.RECONNECTING) {
			return;
		}

		// Parse context if provided
		let context = null;
		contextError = '';

		if (contextInput.trim()) {
			try {
				context = JSON.parse(contextInput);
			} catch (error) {
				contextError = 'Invalid JSON format in context field';
				return;
			}
		}

		const userMessage = {
			role: 'user',
			content: currentMessage,
			timestamp: new Date(),
			context: context
		};

		messages = [...messages, userMessage];
		lastMessageTimestamp = new Date().toISOString();
		const messageToSend = currentMessage;
		currentMessage = '';
		currentSuggestions = []; // Clear suggestions when user sends a message

		// Always send messages to AI agent endpoint, regardless of chat state
		// The backend will handle routing to human operators when needed
		if (agent.config?.enable_streaming) {
			await sendMessageStreaming(messageToSend, context);
		} else {
			await sendMessageRegular(messageToSend, context);
		}
	}

	async function sendMessageRegular(messageToSend: string, context: any) {
		loading = true;

		try {
			const requestBody: any = {
				message: messageToSend,
				user_identifier: 'user-123', // In a real app, this would be the actual user ID
				conversation_id: conversationId
			};

			// Add context if provided
			if (context) {
				requestBody.context = context;
			}

			const response = await api.chatWithAgent(
				data.organization_id,
				data.project._id,
				agent._id,
				requestBody
			);

			if (response.conversation_id && !conversationId) {
				conversationId = response.conversation_id;
			}

			// Handle different response types according to updated API
			let handoffDetected = false;
			let handoffData = response;

			// Check new format first
			if (response.handoff_requested) {
				handoffDetected = true;
			} else if (response.tools_used) {
				// Check legacy format - look for request_human_handoff tool
				const handoffTool = response.tools_used.find(
					(tool) =>
						tool.tool_name === 'request_human_handoff' &&
						tool.success &&
						tool.result?.handoff_requested
				);

				if (handoffTool) {
					handoffDetected = true;
					// Create handoff data in new format for consistent handling
					handoffData = {
						...response,
						handoff_requested: true,
						handoff_info: {
							reason: handoffTool.parameters?.reason || 'Agent requested human assistance',
							urgency: handoffTool.parameters?.urgency || 'medium',
							context_summary: handoffTool.parameters?.context_summary,
							status: 'handoff_requested',
							requested_at: new Date().toISOString()
						}
					};
				}
			}

			if (handoffDetected) {
				// AI requested human intervention
				handleHandoffRequested(handoffData);
			} else if (
				response.status === 'message_queued' ||
				(chatState === ChatStates.HUMAN_ACTIVE && !response.handoff_requested)
			) {
				// Message sent to human operator - don't add a system message, just wait for human response via polling
				// The user message is already in the messages array, human response will come via polling
			} else {
				// Normal AI response
				const botMessage = {
					role: 'assistant',
					content: response.response,
					timestamp: new Date(),
					thinking: response.thinking_process || response.thinking,
					tools_used: response.tools_used
				};

				messages = [...messages, botMessage];

				// Update current suggestions to display separately
				if (response.suggestions && response.suggestions.length > 0) {
					currentSuggestions = response.suggestions;
				} else {
					currentSuggestions = [];
				}
			}
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

	async function sendMessageStreaming(messageToSend: string, context: any) {
		isStreaming = true;
		streamingResponse = '';

		// Only add placeholder message for streaming response if not in human active state
		// When human is active, the response will come via polling, not streaming
		if (chatState !== ChatStates.HUMAN_ACTIVE) {
			const botMessage = {
				role: 'assistant',
				content: '',
				timestamp: new Date(),
				thinking: null,
				tools_used: null,
				isStreaming: true
			};

			messages = [...messages, botMessage];
			streamingMessageIndex = messages.length - 1;
		}

		try {
			const requestBody: any = {
				message: messageToSend,
				user_identifier: 'user-123', // In a real app, this would be the actual user ID
				conversation_id: conversationId
			};

			// Add context if provided
			if (context) {
				requestBody.context = context;
			}

			const response = await api.chatWithAgentStream(
				data.organization_id,
				data.project._id,
				agent._id,
				requestBody
			);

			if (!response.ok) {
				throw new Error('Failed to start streaming chat');
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						try {
							const data = JSON.parse(line.substring(6));

							if (data.type === 'connected') {
								// Stream established
								continue;
							} else if (data.type === 'response_chunk') {
								// Update streaming response only if we have a streaming message placeholder
								if (streamingMessageIndex >= 0) {
									streamingResponse += data.content;
									updateStreamingMessage();
								}
							} else if (data.type === 'complete') {
								// Streaming complete
								if (data.conversation_id && !conversationId) {
									conversationId = data.conversation_id;
								}

								console.log('Streaming complete event received:', data);

								// Check for handoff using universal detection or legacy tools_used detection first
								console.log('Checking for handoff_requested:', data.handoff_requested);

								let handoffDetected = false;
								let handoffData = data;

								// Check new format first
								if (data.handoff_requested) {
									console.log(
										'Handoff detected in streaming complete (new format):',
										data.handoff_info
									);
									handoffDetected = true;
								} else if (data.tools_used) {
									// Check legacy format - look for request_human_handoff tool
									const handoffTool = data.tools_used.find(
										(tool) =>
											tool.tool_name === 'request_human_handoff' &&
											tool.success &&
											tool.result?.handoff_requested
									);

									if (handoffTool) {
										console.log(
											'Handoff detected in streaming complete (legacy format):',
											handoffTool
										);
										handoffDetected = true;
										// Create handoff data in new format for consistent handling
										handoffData = {
											...data,
											handoff_requested: true,
											handoff_info: {
												reason:
													handoffTool.parameters?.reason || 'Agent requested human assistance',
												urgency: handoffTool.parameters?.urgency || 'medium',
												context_summary: handoffTool.parameters?.context_summary,
												status: 'handoff_requested',
												requested_at: new Date().toISOString()
											}
										};
									}
								}

								if (handoffDetected) {
									// Remove the empty streaming message placeholder since handoff was requested
									if (streamingMessageIndex >= 0) {
										messages.splice(streamingMessageIndex, 1);
										messages = [...messages]; // Trigger reactivity
									}
									// Handle handoff request
									handleHandoffRequested(handoffData);
								} else {
									// No handoff detected - finalize the streaming message normally
									if (streamingMessageIndex >= 0) {
										const finalMessage = {
											role: 'assistant',
											content: streamingResponse,
											timestamp: new Date(),
											thinking: data.thinking_process || data.thinking,
											tools_used: data.tools_used,
											isStreaming: false
										};
										messages[streamingMessageIndex] = finalMessage;
									}
									
									console.log('No handoff detected, updating suggestions');
									// Update suggestions for normal completion
									if (data.suggestions && data.suggestions.length > 0) {
										currentSuggestions = data.suggestions;
									} else {
										currentSuggestions = [];
									}
								}

								messages = [...messages]; // Trigger reactivity
								break;
							} else if (data.type === 'handoff_requested') {
								console.log('Handoff requested event received during streaming:', data);
								// Handle handoff during streaming
								// Remove empty streaming message placeholder since handoff was requested
								if (streamingMessageIndex >= 0) {
									messages.splice(streamingMessageIndex, 1);
									messages = [...messages];
								}

								// Handle handoff request
								handleHandoffRequested(data);
								break;
							} else if (data.type === 'error') {
								throw new Error(data.error);
							} else {
								// Log any unhandled event types to help debug
								console.log('Unhandled streaming event:', data);

								// Check if this event contains handoff information
								if (data.handoff_requested) {
									console.log('Handoff detected in unhandled event:', data);
									// Remove empty streaming message placeholder since handoff was requested
									if (streamingMessageIndex >= 0) {
										messages.splice(streamingMessageIndex, 1);
										messages = [...messages];
									}

									// Handle handoff request
									handleHandoffRequested(data);
									break;
								}
							}
						} catch (parseError) {
							console.error('Failed to parse streaming data:', parseError);
						}
					}
				}
			}
		} catch (error) {
			console.error('Failed to stream message:', error);
			const errorMessage = {
				role: 'error',
				content: 'Failed to get response from agent. Please try again.',
				timestamp: new Date()
			};

			// Replace streaming message with error only if we have a streaming message
			if (streamingMessageIndex >= 0) {
				messages[streamingMessageIndex] = errorMessage;
			} else {
				// Add error message if no streaming message was created
				messages = [...messages, errorMessage];
			}
			messages = [...messages]; // Trigger reactivity
		} finally {
			isStreaming = false;
			streamingResponse = '';
			streamingMessageIndex = -1;
		}
	}

	function updateStreamingMessage() {
		if (streamingMessageIndex >= 0 && streamingMessageIndex < messages.length) {
			messages[streamingMessageIndex] = {
				...messages[streamingMessageIndex],
				content: streamingResponse
			};
			messages = [...messages]; // Trigger reactivity
		}
	}

	function handleHandoffRequested(responseData: any) {
		console.log('Handling handoff request:', responseData);

		// Update state
		chatState = ChatStates.WAITING_FOR_HUMAN;
		conversationStatus = 'handoff_requested';
		currentHandler = 'agent';

		// Use the structured handoff_info from the API response
		handoffInfo = responseData.handoff_info || {
			reason: 'Agent requested human assistance',
			urgency: 'medium',
			status: 'handoff_requested',
			requested_at: new Date().toISOString()
		};

		console.log('Handoff info set:', handoffInfo);

		// Add handoff notification message
		let notificationContent =
			responseData.response ||
			responseData.message ||
			'Your request has been forwarded to a human operator. Please wait while we connect you with someone who can better assist you.';

		// Add handoff context if available
		if (handoffInfo.reason && handoffInfo.reason !== 'Agent requested human assistance') {
			notificationContent += `\n\nReason: ${handoffInfo.reason}`;
		}

		const handoffMessage = {
			role: 'system',
			content: notificationContent,
			timestamp: new Date(),
			isHandoffNotification: true,
			handoffInfo: handoffInfo
		};
		messages = [...messages, handoffMessage];

		console.log('Starting polling for human response');
		// Start polling for human response
		startPollingForHumanResponse();
	}

	function startPollingForHumanResponse() {
		if (isPolling || !conversationId) return;

		isPolling = true;

		const poll = async () => {
			try {
				const response = await api.getLatestMessages(conversationId, lastMessageTimestamp);

				// Check for new messages
				if (response.new_messages && response.new_messages.length > 0) {
					response.new_messages.forEach((msg) => {
						if (msg.role === 'human_operator') {
							// Human operator message
							const humanMessage = {
								role: 'human_operator',
								content: msg.content,
								timestamp: new Date(msg.timestamp),
								operator_name: msg.operator_info?.name || 'Support Agent'
							};
							messages = [...messages, humanMessage];
							lastMessageTimestamp = msg.timestamp;
						} else if (msg.role === 'system') {
							// System messages (connection established, etc.)
							let content = msg.content;
							
							// If this is a generic connection message and we have operator info, personalize it
							if (content.includes('You are now connected with Support Agent from our support team') && 
								response.operator_info?.name && 
								response.operator_info.name !== 'Support Agent') {
								content = `You are now connected with ${response.operator_info.name} from our support team.`;
							}
							
							// Check for duplicates before adding
							const isDuplicate = messages.some(existingMsg => 
								existingMsg.role === 'system' && 
								existingMsg.content && 
								existingMsg.content.includes('You are now connected with') &&
								existingMsg.content.includes('from our support team')
							);
							
							if (!isDuplicate) {
								const systemMessage = {
									role: 'system',
									content: content,
									timestamp: new Date(msg.timestamp),
									isSystemMessage: true
								};
								messages = [...messages, systemMessage];
							}
							lastMessageTimestamp = msg.timestamp;
						}
					});
				}

				// Check conversation state changes
				if (response.current_handler !== currentHandler) {
					currentHandler = response.current_handler;

					if (currentHandler === 'human') {
						// Human connected
						chatState = ChatStates.HUMAN_ACTIVE;
						humanOperator = response.operator_info || { name: 'Support Agent' };

						// Check if we already have a connection message to avoid duplicates
						const hasConnectionMessage = messages.some(msg => 
							msg.role === 'system' && 
							msg.content && 
							msg.content.includes('You are now connected with') &&
							msg.content.includes('from our support team')
						);

						// Only add connection message if not already present
						if (!hasConnectionMessage) {
							const connectionMessage = {
								role: 'system',
								content: `You are now connected with ${humanOperator.name} from our support team.`,
								timestamp: new Date(),
								isSystemMessage: true
							};
							messages = [...messages, connectionMessage];
						}
					} else if (currentHandler === 'agent') {
						// Conversation returned to AI
						chatState = ChatStates.NORMAL_CHAT;
						humanOperator = null;
						stopPollingForHumanResponse();

						const resumeMessage = {
							role: 'system',
							content: 'You are now back with our AI assistant.',
							timestamp: new Date(),
							isSystemMessage: true
						};
						messages = [...messages, resumeMessage];
					}
				}

				// Update conversation status
				if (response.conversation_status !== conversationStatus) {
					conversationStatus = response.conversation_status;
				}
			} catch (error) {
				console.error('Polling error:', error);
				chatState = ChatStates.RECONNECTING;
				// Continue polling to recover from temporary errors
			}
		};

		// Poll every 2 seconds while waiting for human
		pollInterval = setInterval(poll, 2000);
	}

	function stopPollingForHumanResponse() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
		isPolling = false;
	}

	function handleKeyPress(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function getInputPlaceholder() {
		switch (chatState) {
			case ChatStates.WAITING_FOR_HUMAN:
				return 'Connecting you with support...';
			case ChatStates.HUMAN_ACTIVE:
				return `Message ${humanOperator?.name || 'support team'}...`;
			case ChatStates.RECONNECTING:
				return 'Reconnecting...';
			default:
				return 'Type your message...';
		}
	}

	function isInputDisabled() {
		return (
			chatState === ChatStates.WAITING_FOR_HUMAN ||
			chatState === ChatStates.RECONNECTING ||
			loading ||
			isStreaming
		);
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

	// Auto-scroll when messages change
	$: if (messages.length > 0) {
		// Use a small delay to ensure DOM is updated
		setTimeout(scrollToBottom, 10);
	}

	// Cleanup function
	onDestroy(() => {
		stopPollingForHumanResponse();
		if (humanStream) {
			humanStream.close();
		}
	});

	function formatTime(timestamp) {
		return new Date(timestamp).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function sendSuggestion(suggestionText) {
		currentMessage = suggestionText;
		currentSuggestions = []; // Clear suggestions when clicked
		sendMessage();
	}

	function toggleContextForm() {
		showContextForm = !showContextForm;
		contextError = '';
	}

	function setExampleContext() {
		contextInput = JSON.stringify(
			{
				current_datetime: new Date().toISOString(),
				user_session_id: 'session_abc123',
				user_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				user_location: 'Unknown',
				company_name: 'Acme Corp'
			},
			null,
			2
		);
		contextError = '';
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
					<div class="flex items-center space-x-2">
						<p class="text-sm text-gray-400">Chat with AI Agent</p>
						{#if chatState === ChatStates.WAITING_FOR_HUMAN}
							<span
								class="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400"
							>
								<i class="fas fa-clock mr-1"></i>
								Waiting for Human
							</span>
						{:else if chatState === ChatStates.HUMAN_ACTIVE}
							<span
								class="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400"
							>
								<i class="fas fa-user mr-1"></i>
								{humanOperator?.name || 'Support Agent'}
							</span>
						{:else if chatState === ChatStates.RECONNECTING}
							<span
								class="inline-flex items-center rounded-full bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-400"
							>
								<i class="fas fa-wifi mr-1"></i>
								Reconnecting
							</span>
						{/if}
					</div>
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
		<div bind:this={messagesContainer} class="flex-1 space-y-4 overflow-y-auto p-4">
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
									{#if message.context}
										<div class="mt-2 rounded bg-indigo-700/50 px-3 py-2">
											<div class="mb-1 flex items-center space-x-1">
												<i class="fas fa-cog text-xs"></i>
												<span class="text-xs font-medium">Context provided</span>
											</div>
											<!-- <pre class="whitespace-pre-wrap text-xs text-indigo-200">{JSON.stringify(
													message.context,
													null,
													2
												)}</pre> -->
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

									<div class="mb-2 whitespace-pre-wrap text-gray-100">
										{message.content}
										{#if message.isStreaming}
											<span class="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400"
											></span>
										{/if}
									</div>

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
							{:else if message.role === 'human_operator'}
								<div class="rounded-lg border border-green-700 bg-green-800 px-4 py-2">
									<div class="mb-2 flex items-center space-x-2">
										<div
											class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
										>
											<i class="fas fa-user text-xs text-white"></i>
										</div>
										<span class="text-sm font-medium text-green-100"
											>{message.operator_name || 'Support Agent'}</span
										>
										<span class="text-xs text-green-300">{formatTime(message.timestamp)}</span>
									</div>

									<div class="whitespace-pre-wrap text-green-50">
										{message.content}
									</div>
								</div>
							{:else if message.role === 'system'}
								<div class="flex justify-center">
									<div class="max-w-md rounded-lg border border-gray-600 bg-gray-700/50 px-4 py-2">
										<div class="flex items-start space-x-2">
											<i
												class="fas fa-{message.isHandoffNotification
													? 'hand-paper'
													: 'info-circle'} text-sm text-{message.isHandoffNotification
													? 'yellow'
													: 'blue'}-400 mt-0.5"
											></i>
											<div class="flex-1">
												<div class="whitespace-pre-wrap text-sm text-gray-300">
													{message.content}
												</div>
												{#if message.handoffInfo}
													<div class="mt-2 text-xs text-gray-400">
														<div class="flex items-center space-x-2">
															<span>Priority: {message.handoffInfo.urgency || 'medium'}</span>
															{#if message.handoffInfo.requested_at}
																<span
																	>• Requested: {new Date(
																		message.handoffInfo.requested_at
																	).toLocaleTimeString()}</span
																>
															{/if}
														</div>
													</div>
												{/if}
											</div>
										</div>
									</div>
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

			{#if loading && !isStreaming}
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

		<!-- Question Suggestions -->
		{#if currentSuggestions && currentSuggestions.length > 0}
			<div class="border-t border-gray-800 bg-gray-900/50 px-4 py-3">
				<div class="mb-3 flex items-center justify-between">
					<div class="flex items-center space-x-2">
						<i class="fas fa-lightbulb text-sm text-yellow-400"></i>
						<span class="text-sm font-medium text-gray-300">Try asking:</span>
					</div>
					<button
						on:click={() => (currentSuggestions = [])}
						class="text-xs text-gray-400 transition-colors hover:text-gray-300"
						title="Dismiss suggestions"
						aria-label="Dismiss suggestions"
					>
						<i class="fas fa-times"></i>
					</button>
				</div>
				<div class="flex flex-wrap gap-2">
					{#each currentSuggestions as suggestion, index}
						<button
							on:click={() => sendSuggestion(suggestion)}
							disabled={loading || isStreaming}
							class="inline-flex items-center rounded-lg border border-gray-600 bg-gradient-to-r from-gray-700 to-gray-600 px-4 py-2 text-sm text-gray-200 shadow-sm transition-all hover:from-gray-600 hover:to-gray-500 hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
							style="animation-delay: {index * 100}ms"
						>
							<i class="fas fa-comment-dots mr-2 text-xs text-gray-400"></i>
							{suggestion}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Context Form (Optional) -->
		<div class="border-t border-gray-800">
			<button
				on:click={toggleContextForm}
				class="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-gray-400 transition-colors hover:bg-gray-800/50"
			>
				<div class="flex items-center space-x-2">
					<i class="fas fa-cog"></i>
					<span>Advanced: Add Context</span>
					<span class="text-xs text-gray-500">(Optional)</span>
				</div>
				<i class="fas fa-chevron-{showContextForm ? 'up' : 'down'}"></i>
			</button>

			{#if showContextForm}
				<div class="border-t border-gray-800 p-4">
					<div class="mb-3 flex items-center justify-between">
						<label for="context-input" class="text-sm font-medium text-gray-300"
							>Context (JSON)</label
						>
						<button
							on:click={setExampleContext}
							class="text-xs text-indigo-400 hover:text-indigo-300"
						>
							Use Example
						</button>
					</div>

					<textarea
						id="context-input"
						bind:value={contextInput}
						placeholder="Enter JSON context (optional)"
						rows="4"
						class="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
					></textarea>

					{#if contextError}
						<p class="mt-2 text-xs text-red-400">
							<i class="fas fa-exclamation-triangle mr-1"></i>
							{contextError}
						</p>
					{/if}

					<p class="mt-2 text-xs text-gray-500">
						Provide additional context for the agent as a JSON object. This can include user
						information, session data, or any relevant context.
					</p>
				</div>
			{/if}
		</div>

		<!-- Chat State Indicator -->
		{#if chatState !== ChatStates.NORMAL_CHAT}
			<div class="border-t border-gray-800 bg-gray-900/50 px-4 py-3">
				<div class="flex items-center space-x-2">
					{#if chatState === ChatStates.WAITING_FOR_HUMAN}
						<div class="flex space-x-1">
							<div class="h-2 w-2 animate-bounce rounded-full bg-yellow-400"></div>
							<div
								class="h-2 w-2 animate-bounce rounded-full bg-yellow-400"
								style="animation-delay: 0.1s"
							></div>
							<div
								class="h-2 w-2 animate-bounce rounded-full bg-yellow-400"
								style="animation-delay: 0.2s"
							></div>
						</div>
						<span class="text-sm text-yellow-400">Connecting you with support...</span>
						{#if handoffInfo?.urgency}
							<span
								class="rounded-full px-2 py-1 text-xs bg-{handoffInfo.urgency === 'high'
									? 'red'
									: handoffInfo.urgency === 'medium'
										? 'yellow'
										: 'gray'}-500/20 text-{handoffInfo.urgency === 'high'
									? 'red'
									: handoffInfo.urgency === 'medium'
										? 'yellow'
										: 'gray'}-400"
							>
								{handoffInfo.urgency} priority
							</span>
						{/if}
					{:else if chatState === ChatStates.HUMAN_ACTIVE}
						<i class="fas fa-user text-green-400"></i>
						<span class="text-sm text-green-400"
							>Connected with {humanOperator?.name || 'Support Agent'}</span
						>
					{:else if chatState === ChatStates.RECONNECTING}
						<i class="fas fa-wifi animate-pulse text-orange-400"></i>
						<span class="text-sm text-orange-400">Reconnecting...</span>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Input Area -->
		<div class="border-t border-gray-800 p-4">
			<div class="flex items-end space-x-3">
				<div class="flex-1">
					<textarea
						bind:value={currentMessage}
						on:keydown={handleKeyPress}
						placeholder="{getInputPlaceholder()} (Press Enter to send, Shift+Enter for new line)"
						rows="1"
						disabled={isInputDisabled()}
						class="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
						style="min-height: 44px; max-height: 120px;"
					></textarea>
				</div>
				<button
					on:click={sendMessage}
					disabled={!currentMessage.trim() || isInputDisabled()}
					class="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading || isStreaming}
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
