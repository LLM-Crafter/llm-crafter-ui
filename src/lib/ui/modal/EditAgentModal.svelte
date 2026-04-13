<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { api } from '$lib/api';
	import GoogleCalendarConfigModal from './GoogleCalendarConfigModal.svelte';

	export let data;
	export let agent;
	const dispatch = createEventDispatcher();

	let loading = false;
	let error = '';

	// Google Calendar config modal state
	let showGoogleCalendarConfig = false;

	// Initialize values from existing agent
	let name = agent.name || '';
	let description = agent.description || '';
	let systemPrompt = agent.system_prompt || '';
	let apiKeyId = agent.api_key._id || '';
	let temperature = agent.llm_settings?.parameters?.temperature || 0.7;
	let maxTokens = agent.llm_settings?.parameters?.max_tokens || 1000;
	let model = agent.llm_settings?.model || '';
	let isActive = agent.is_active !== undefined ? agent.is_active : true;
	let selectedTools = agent.tools.map((tool) => tool.name) || [];

	// Initialize question suggestions values from existing agent
	let suggestionsEnabled = agent.question_suggestions?.enabled || false;
	let suggestionsCount = agent.question_suggestions?.count || 3;
	let suggestionsApiKeyId =
		(agent.question_suggestions && agent.question_suggestions.api_key) || '';
	let suggestionsModel = (agent.question_suggestions && agent.question_suggestions.model) || '';
	let suggestionsCustomPrompt =
		(agent.question_suggestions && agent.question_suggestions.custom_prompt) || '';

	// Initialize streaming configuration
	let streamingEnabled =
		agent.config?.enable_streaming !== undefined ? agent.config.enable_streaming : true;

	// Initialize language detection configuration
	let enforceLanguageDetection =
		agent.config?.enforce_language_detection !== undefined
			? agent.config.enforce_language_detection
			: false;

	// Initialize GDPR settings
	let gdprEncryptMessages: boolean =
		agent.gdpr?.encrypt_messages !== undefined ? agent.gdpr.encrypt_messages : true;
	let gdprRetentionDays: number | null = agent.gdpr?.retention_days ?? null;

	// Initialize V2 small agent graph settings (chatbot only)
	let enableSmallAgentGraph: boolean = agent.config?.enable_small_agent_graph ?? false;
	let plannerModel: string | null = agent.config?.graph_models?.planner_model ?? null;
	let responderModel: string | null = agent.config?.graph_models?.responder_model ?? null;
	let criticModel: string | null = agent.config?.graph_models?.critic_model ?? null;

	// Prompt mode (V2 only: 'system_prompt' | 'prompt_sections')
	let promptMode: 'system_prompt' | 'prompt_sections' = agent.config?.prompt_sections
		? 'prompt_sections'
		: 'system_prompt';
	let promptSections = {
		identity_and_tone: agent.config?.prompt_sections?.identity_and_tone || '',
		tools_and_apis: agent.config?.prompt_sections?.tools_and_apis || '',
		conversation_flow: agent.config?.prompt_sections?.conversation_flow || '',
		output_format: agent.config?.prompt_sections?.output_format || '',
		guardrails: agent.config?.prompt_sections?.guardrails || '',
		domain_workflows: agent.config?.prompt_sections?.domain_workflows || ''
	};

	// Reset to system_prompt when switching back to V1
	$: if (!enableSmallAgentGraph) promptMode = 'system_prompt';

	// Derived provider for suggestions API key
	$: suggestionsProvider = suggestionsApiKeyId
		? (data.project as any).apiKeys?.find((api_key: any) => api_key._id === suggestionsApiKeyId)
				?.provider
		: null;

	// Derived provider based on selected API key
	$: provider = apiKeyId
		? (data.project as any).apiKeys?.find((api_key: any) => api_key._id === apiKeyId)?.provider
		: null;

	const availableTools = [
		{ id: 'web_search', name: 'Web Search', description: 'Search the internet for information' },
		{
			id: 'webpage_scraper',
			name: 'Webpage Scraper',
			description: 'Extract and process content from web pages'
		},
		{ id: 'calculator', name: 'Calculator', description: 'Perform mathematical calculations' },
		{ id: 'llm_prompt', name: 'LLM Prompt', description: 'Execute additional LLM prompts' },
		{ id: 'current_time', name: 'Current Time', description: 'Get current date and time' },
		{ id: 'json_processor', name: 'JSON Processor', description: 'Parse and manipulate JSON data' },
		{
			id: 'api_caller',
			name: 'API Caller',
			description: 'Make secure API calls to pre-configured endpoints'
		},
		{
			id: 'faq',
			name: 'FAQ',
			description: 'Answer questions using configured frequently asked questions'
		},
		{
			id: 'rag_search',
			name: 'RAG Search',
			description: 'Search indexed documents and knowledge base using RAG'
		},
		{
			id: 'request_human_handoff',
			name: 'Human Handoff',
			description: 'Request human operator intervention for complex issues or frustrated users'
		},
		{
			id: 'google_calendar',
			name: 'Google Calendar',
			description: 'Manage Google Calendar events - create, read, update, and delete appointments'
		}
	];

	// Filter tools based on agent type
	$: filteredTools = availableTools.filter((tool) => {
		// Human handoff is only available for chatbot agents
		if (tool.id === 'request_human_handoff') {
			return agent.type === 'chatbot';
		}
		return true;
	});

	function toggleTool(toolId) {
		if (selectedTools.includes(toolId)) {
			selectedTools = selectedTools.filter((id) => id !== toolId);
		} else {
			selectedTools = [...selectedTools, toolId];
		}
	}

	function getToolIcon(toolId) {
		switch (toolId) {
			case 'web_search':
				return 'fas fa-search';
			case 'webpage_scraper':
				return 'fas fa-window-restore';
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
			case 'google_calendar':
				return 'fab fa-google';
			default:
				return 'fas fa-tools';
		}
	}

	function getToolColor(toolId) {
		switch (toolId) {
			case 'web_search':
				return 'from-blue-500 to-cyan-500';
			case 'webpage_scraper':
				return 'from-purple-600 to-violet-600';
			case 'calculator':
				return 'from-green-500 to-emerald-500';
			case 'llm_prompt':
				return 'from-purple-500 to-pink-500';
			case 'current_time':
				return 'from-yellow-500 to-orange-500';
			case 'json_processor':
				return 'from-gray-500 to-slate-500';
			case 'api_caller':
				return 'from-red-500 to-pink-500';
			case 'faq':
				return 'from-cyan-500 to-teal-500';
			case 'rag_search':
				return 'from-orange-500 to-red-500';
			case 'request_human_handoff':
				return 'from-indigo-500 to-blue-500';
			case 'google_calendar':
				return 'from-red-600 to-yellow-500';
			default:
				return 'from-indigo-500 to-purple-600';
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

	async function updateAgent() {
		loading = true;
		error = '';

		try {
			const agentData = {
				name,
				description,
				system_prompt: promptMode === 'system_prompt' ? systemPrompt : '',
				api_key: apiKeyId,
				llm_settings: {
					model,
					parameters: {
						temperature,
						max_tokens: maxTokens
					}
				},
				tools: selectedTools,
				is_active: isActive,
				config: {
					enable_streaming: streamingEnabled,
					...(agent.type === 'chatbot'
						? {
								enforce_language_detection: enforceLanguageDetection,
								enable_small_agent_graph: enableSmallAgentGraph,
								...(enableSmallAgentGraph
									? {
											graph_models: {
												planner_model: plannerModel || null,
												responder_model: responderModel || null,
												critic_model: criticModel || null
											},
											...(promptMode === 'prompt_sections'
												? { prompt_sections: promptSections }
												: {})
										}
									: {})
							}
						: {})
				},
				question_suggestions: {
					enabled: suggestionsEnabled,
					count: suggestionsCount,
					api_key: suggestionsEnabled ? suggestionsApiKeyId : null,
					model: suggestionsEnabled ? suggestionsModel : null,
					custom_prompt:
						suggestionsEnabled && suggestionsCustomPrompt.trim() ? suggestionsCustomPrompt : null
				},
				gdpr: {
					encrypt_messages: gdprEncryptMessages,
					retention_days: gdprRetentionDays
				}
			};

			if (!suggestionsEnabled) {
				delete agentData.question_suggestions;
			}

			const res = await api.fetch(
				`/organizations/${data.organization_id}/projects/${data.project._id}/agents/${agent._id}`,
				{
					method: 'PUT',
					body: JSON.stringify(agentData)
				}
			);

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || 'Failed to update agent');
			}

			const updatedAgent = await res.json();
			dispatch('updated', updatedAgent);
		} catch (err) {
			error = err.message || 'Something went wrong';
		} finally {
			loading = false;
		}
	}

	// ...existing code...
</script>

<!-- BACKDROP -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
	<!-- MODAL -->
	<div
		class="mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 shadow-2xl"
	>
		<!-- Header -->
		<div class="sticky top-0 border-b border-gray-800 bg-gray-900 p-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r {getTypeColor(
							agent.type
						)}"
					>
						<i class="{getTypeIcon(agent.type)} text-white"></i>
					</div>
					<div>
						<h2 class="text-xl font-bold text-white">Edit Agent</h2>
						<p class="text-sm text-gray-400">Modify {agent.name} configuration</p>
					</div>
				</div>
				<button
					on:click={() => dispatch('close')}
					class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-300"
				>
					<i class="fas fa-times"></i>
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="space-y-8 p-6">
			<!-- Basic Information -->
			<div class="space-y-6">
				<div class="flex items-center space-x-2">
					<i class="fas fa-info-circle text-indigo-400"></i>
					<h3 class="text-lg font-semibold text-gray-100">Basic Information</h3>
				</div>

				<div class="grid grid-cols-1 gap-6">
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-300" for="edit-agent-name">
							Agent Name *
						</label>
						<input
							id="edit-agent-name"
							type="text"
							bind:value={name}
							disabled={loading}
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>

					<div>
						<label
							class="mb-2 block text-sm font-medium text-gray-300"
							for="edit-agent-description"
						>
							Description
						</label>
						<textarea
							id="edit-agent-description"
							bind:value={description}
							rows="3"
							disabled={loading}
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						></textarea>
					</div>

					<div
						class="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4"
					>
						<div>
							<h4 class="font-medium text-gray-100">Agent Status</h4>
							<p class="text-sm text-gray-400">Enable or disable this agent</p>
						</div>
						<label class="relative inline-flex cursor-pointer items-center">
							<input
								type="checkbox"
								bind:checked={isActive}
								disabled={loading}
								class="peer sr-only"
							/>
							<div
								class="peer h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300"
							></div>
						</label>
					</div>
				</div>
			</div>

			<!-- LLM Configuration -->
			<div class="space-y-6">
				<div class="flex items-center space-x-2">
					<i class="fas fa-brain text-purple-400"></i>
					<h3 class="text-lg font-semibold text-gray-100">LLM Configuration</h3>
				</div>

				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-300" for="edit-agent-api-key">
							API Key *
						</label>
						<select
							id="edit-agent-api-key"
							bind:value={apiKeyId}
							disabled={loading}
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							<option value="">Select API key...</option>
							{#each (data.project as any).apiKeys || [] as apiKey}
								<option value={apiKey._id}>{apiKey.name}</option>
							{/each}
						</select>
						<p class="mt-1 text-xs text-gray-500">Choose from project's configured API keys</p>
					</div>

					{#if provider}
						<div>
							<label class="mb-2 block text-sm font-medium text-gray-300" for="edit-agent-model">
								Model *
							</label>
							<select
								id="edit-agent-model"
								bind:value={model}
								disabled={loading}
								class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							>
								<option value="">Select a model</option>
								{#each provider.models as modelOption}
									<option value={modelOption}>{modelOption}</option>
								{/each}
							</select>
							<p class="mt-1 text-xs text-gray-500">Available models for selected provider</p>
						</div>
					{/if}
				</div>

				<!-- Prompt mode toggle: only visible when V2 is active -->
				{#if enableSmallAgentGraph}
					<div
						class="flex items-center space-x-1 rounded-lg border border-gray-700 bg-gray-800/60 p-1"
					>
						<button
							type="button"
							on:click={() => (promptMode = 'system_prompt')}
							class="flex flex-1 items-center justify-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-all {promptMode ===
							'system_prompt'
								? 'bg-gray-700 text-gray-100 shadow'
								: 'text-gray-400 hover:text-gray-200'}"
						>
							<i class="fas fa-align-left"></i>
							<span>System Prompt</span>
						</button>
						<button
							type="button"
							on:click={() => (promptMode = 'prompt_sections')}
							class="flex flex-1 items-center justify-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-all {promptMode ===
							'prompt_sections'
								? 'bg-violet-600 text-white shadow'
								: 'text-gray-400 hover:text-gray-200'}"
						>
							<i class="fas fa-layer-group"></i>
							<span
								>Prompt Sections <span class="ml-1 rounded bg-violet-500/30 px-1.5 py-0.5 text-xs"
									>V2</span
								></span
							>
						</button>
					</div>
				{/if}

				{#if promptMode === 'system_prompt'}
					<div>
						<label
							class="mb-2 block text-sm font-medium text-gray-300"
							for="edit-agent-system-prompt"
						>
							System Prompt *
						</label>
						<textarea
							id="edit-agent-system-prompt"
							bind:value={systemPrompt}
							rows="6"
							disabled={loading}
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						></textarea>
					</div>
				{:else}
					<!-- Prompt Sections (V2 only) -->
					<div class="space-y-4 rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
						<p class="text-xs text-gray-400">
							<i class="fas fa-info-circle mr-1 text-violet-400"></i>
							Define each section independently. The V2 engine composes them into the final prompt automatically.
							All sections are optional.
						</p>
						<div>
							<label
								class="mb-1.5 flex items-center space-x-2 text-sm font-medium text-gray-300"
								for="ps-edit-identity"
							>
								<i class="fas fa-user-circle text-blue-400"></i><span>Identity &amp; Tone</span>
							</label>
							<textarea
								id="ps-edit-identity"
								bind:value={promptSections.identity_and_tone}
								placeholder="You are a professional assistant. Use a warm but concise tone."
								rows="2"
								disabled={loading}
								class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
							></textarea>
						</div>
						<div>
							<label
								class="mb-1.5 flex items-center space-x-2 text-sm font-medium text-gray-300"
								for="ps-edit-tools"
							>
								<i class="fas fa-plug text-green-400"></i><span>Tools &amp; APIs</span>
							</label>
							<textarea
								id="ps-edit-tools"
								bind:value={promptSections.tools_and_apis}
								placeholder="Always use rag_search before answering. Never guess tool IDs."
								rows="2"
								disabled={loading}
								class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
							></textarea>
						</div>
						<div>
							<label
								class="mb-1.5 flex items-center space-x-2 text-sm font-medium text-gray-300"
								for="ps-edit-flow"
							>
								<i class="fas fa-stream text-violet-400"></i><span>Conversation Flow</span>
							</label>
							<textarea
								id="ps-edit-flow"
								bind:value={promptSections.conversation_flow}
								placeholder="1. Greet → 2. Qualify → 3. Search → 4. Present → 5. Close"
								rows="2"
								disabled={loading}
								class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
							></textarea>
						</div>
						<div>
							<label
								class="mb-1.5 flex items-center space-x-2 text-sm font-medium text-gray-300"
								for="ps-edit-format"
							>
								<i class="fas fa-list-ul text-yellow-400"></i><span>Output Format</span>
							</label>
							<textarea
								id="ps-edit-format"
								bind:value={promptSections.output_format}
								placeholder="Use bullet lists for results. Include price, key details, and location."
								rows="2"
								disabled={loading}
								class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
							></textarea>
						</div>
						<div>
							<label
								class="mb-1.5 flex items-center space-x-2 text-sm font-medium text-gray-300"
								for="ps-edit-guardrails"
							>
								<i class="fas fa-shield-alt text-red-400"></i><span>Guardrails</span>
							</label>
							<textarea
								id="ps-edit-guardrails"
								bind:value={promptSections.guardrails}
								placeholder="Never invent details. Say honestly if no results are found."
								rows="2"
								disabled={loading}
								class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
							></textarea>
						</div>
						<div>
							<label
								class="mb-1.5 flex items-center space-x-2 text-sm font-medium text-gray-300"
								for="ps-edit-domain"
							>
								<i class="fas fa-project-diagram text-orange-400"></i><span>Domain Workflows</span>
							</label>
							<textarea
								id="ps-edit-domain"
								bind:value={promptSections.domain_workflows}
								placeholder="When filtering: always search first, then present max 5 results with key details."
								rows="2"
								disabled={loading}
								class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
							></textarea>
						</div>
					</div>
				{/if}

				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<div>
						<label
							class="mb-2 block text-sm font-medium text-gray-300"
							for="edit-agent-temperature"
						>
							Temperature: {temperature}
						</label>
						<input
							id="edit-agent-temperature"
							type="range"
							min="0"
							max="2"
							step="0.1"
							bind:value={temperature}
							disabled={loading}
							class="w-full"
						/>
						<div class="mt-1 flex justify-between text-xs text-gray-500">
							<span>Focused (0)</span>
							<span>Creative (2)</span>
						</div>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium text-gray-300" for="edit-agent-max-tokens">
							Max Tokens
						</label>
						<input
							id="edit-agent-max-tokens"
							type="number"
							min="1"
							max="4096"
							bind:value={maxTokens}
							disabled={loading}
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					</div>
				</div>

				{#if agent.type === 'chatbot'}
					<!-- Agent Version Selector -->
					<div class="space-y-4">
						<div>
							<h4 class="text-sm font-medium text-gray-300">Agent Version</h4>
							<p class="mt-0.5 text-xs text-gray-500">
								Choose how the agent processes conversations
							</p>
						</div>

						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<!-- V1 -->
							<button
								type="button"
								on:click={() => (enableSmallAgentGraph = false)}
								class="relative rounded-lg border-2 p-4 text-left transition-all {!enableSmallAgentGraph
									? 'border-indigo-500 bg-indigo-500/10'
									: 'border-gray-700 hover:border-gray-600'}"
							>
								<div class="flex items-start space-x-3">
									<div
										class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500"
									>
										<i class="fas fa-robot text-white"></i>
									</div>
									<div>
										<h5 class="font-medium text-gray-100">
											V1 <span class="ml-1 text-xs font-normal text-gray-400">Classic</span>
										</h5>
										<p class="text-sm text-gray-400">
											Single-model agent. Fast and straightforward for most use cases.
										</p>
									</div>
								</div>
								{#if !enableSmallAgentGraph}
									<div class="absolute right-3 top-3">
										<i class="fas fa-check-circle text-indigo-500"></i>
									</div>
								{/if}
							</button>

							<!-- V2 -->
							<button
								type="button"
								on:click={() => (enableSmallAgentGraph = true)}
								class="relative rounded-lg border-2 p-4 text-left transition-all {enableSmallAgentGraph
									? 'border-violet-500 bg-violet-500/10'
									: 'border-gray-700 hover:border-gray-600'}"
							>
								<div class="flex items-start space-x-3">
									<div
										class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-violet-500 to-purple-600"
									>
										<i class="fas fa-project-diagram text-white"></i>
									</div>
									<div>
										<h5 class="font-medium text-gray-100">
											V2 <span class="ml-1 text-xs font-normal text-violet-400"
												>Small Agent Graph</span
											>
										</h5>
										<p class="text-sm text-gray-400">
											Multi-model pipeline with planner, responder, and critic roles for richer
											responses.
										</p>
									</div>
								</div>
								{#if enableSmallAgentGraph}
									<div class="absolute right-3 top-3">
										<i class="fas fa-check-circle text-violet-500"></i>
									</div>
								{/if}
							</button>
						</div>

						{#if enableSmallAgentGraph}
							<div class="space-y-4 rounded-lg border border-violet-500/30 bg-violet-500/5 p-5">
								<div class="flex items-center space-x-2">
									<i class="fas fa-project-diagram text-violet-400"></i>
									<h5 class="text-sm font-medium text-violet-300">Graph Model Configuration</h5>
								</div>
								<p class="text-xs text-gray-400">
									Each role can use a different model. Leave empty to use the main model above for
									that role.
								</p>

								{#if provider}
									<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
										<div>
											<label
												class="mb-2 block text-xs font-medium text-gray-300"
												for="edit-planner-model"
											>
												<i class="fas fa-sitemap mr-1 text-blue-400"></i> Planner Model
											</label>
											<select
												id="edit-planner-model"
												bind:value={plannerModel}
												disabled={loading}
												class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
											>
												<option value={null}>Default (main model)</option>
												{#each provider.models as modelOption}
													<option value={modelOption}>{modelOption}</option>
												{/each}
											</select>
											<p class="mt-1 text-xs text-gray-500">Breaks down the task</p>
										</div>

										<div>
											<label
												class="mb-2 block text-xs font-medium text-gray-300"
												for="edit-responder-model"
											>
												<i class="fas fa-comments mr-1 text-green-400"></i> Responder Model
											</label>
											<select
												id="edit-responder-model"
												bind:value={responderModel}
												disabled={loading}
												class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
											>
												<option value={null}>Default (main model)</option>
												{#each provider.models as modelOption}
													<option value={modelOption}>{modelOption}</option>
												{/each}
											</select>
											<p class="mt-1 text-xs text-gray-500">Generates the response</p>
										</div>

										<div>
											<label
												class="mb-2 block text-xs font-medium text-gray-300"
												for="edit-critic-model"
											>
												<i class="fas fa-check-double mr-1 text-yellow-400"></i> Critic Model
											</label>
											<select
												id="edit-critic-model"
												bind:value={criticModel}
												disabled={loading}
												class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
											>
												<option value={null}>Default (main model)</option>
												{#each provider.models as modelOption}
													<option value={modelOption}>{modelOption}</option>
												{/each}
											</select>
											<p class="mt-1 text-xs text-gray-500">Reviews and refines</p>
										</div>
									</div>
								{:else}
									<div
										class="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-400"
									>
										Select an API key above to configure graph models.
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Tools Configuration -->
			<div class="space-y-6">
				<div class="flex items-center space-x-2">
					<i class="fas fa-tools text-green-400"></i>
					<h3 class="text-lg font-semibold text-gray-100">Tools & Capabilities</h3>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{#each filteredTools as tool}
						<button
							type="button"
							on:click={() => toggleTool(tool.id)}
							disabled={loading}
							class="relative rounded-lg border-2 p-4 text-left transition-all {selectedTools.includes(
								tool.id
							)
								? 'border-indigo-500 bg-indigo-500/10'
								: 'border-gray-700 hover:border-gray-600'}"
						>
							<div class="flex items-start space-x-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r {getToolColor(
										tool.id
									)}"
								>
									<i class="{getToolIcon(tool.id)} text-white"></i>
								</div>
								<div class="flex-1">
									<h4 class="font-medium text-gray-100">{tool.name}</h4>
									<p class="text-sm text-gray-400">{tool.description}</p>
								</div>
							</div>
							{#if selectedTools.includes(tool.id)}
								<div class="absolute right-3 top-3">
									<i class="fas fa-check-circle text-indigo-500"></i>
								</div>
							{/if}
						</button>
					{/each}
				</div>

				{#if selectedTools.length > 0}
					<div class="rounded-lg bg-indigo-500/10 p-4">
						<h4 class="mb-2 font-medium text-indigo-400">Selected Tools:</h4>
						<div class="flex flex-wrap gap-2">
							{#each selectedTools as toolId}
								{@const tool = availableTools.find((t) => t.id === toolId)}
								<span
									class="inline-flex items-center rounded-md bg-indigo-500/20 px-2.5 py-0.5 text-sm font-medium text-indigo-400"
								>
									{tool?.name}
								</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Google Calendar Configuration -->
				{#if selectedTools.includes('google_calendar')}
					<div class="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
						<div class="flex items-start justify-between">
							<div class="flex items-start space-x-3">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-yellow-500"
								>
									<i class="fab fa-google text-sm text-white"></i>
								</div>
								<div>
									<h4 class="font-medium text-yellow-400">
										Google Calendar Configuration Required
									</h4>
									<p class="text-sm text-yellow-300">
										Configure OAuth tokens and calendar settings to enable this tool
									</p>
								</div>
							</div>
							<button
								type="button"
								on:click={() => (showGoogleCalendarConfig = true)}
								disabled={loading}
								class="rounded-lg bg-gradient-to-r from-red-600 to-yellow-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-red-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
							>
								<i class="fas fa-cog mr-2"></i>
								Configure
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Streaming Configuration -->
			<div class="space-y-6">
				<div class="flex items-center space-x-2">
					<i class="fas fa-stream text-blue-400"></i>
					<h3 class="text-lg font-semibold text-gray-100">Response Streaming</h3>
				</div>

				<!-- Enable/Disable Toggle -->
				<div
					class="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4"
				>
					<div>
						<h4 class="font-medium text-gray-100">Enable Response Streaming</h4>
						<p class="text-sm text-gray-400">
							Stream responses in real-time as they're generated for better user experience
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input
							type="checkbox"
							bind:checked={streamingEnabled}
							disabled={loading}
							class="peer sr-only"
						/>
						<div
							class="peer h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300"
						></div>
					</label>
				</div>
			</div>

			{#if agent.type === 'chatbot'}
				<!-- Language Detection Configuration -->
				<div class="space-y-6">
					<div class="flex items-center space-x-2">
						<i class="fas fa-language text-green-400"></i>
						<h3 class="text-lg font-semibold text-gray-100">Language Detection</h3>
					</div>

					<!-- Enable/Disable Toggle -->
					<div
						class="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4"
					>
						<div>
							<h4 class="font-medium text-gray-100">Enforce Language Detection</h4>
							<p class="text-sm text-gray-400">
								Force the agent to detect and respond in the user's language
							</p>
						</div>
						<label class="relative inline-flex cursor-pointer items-center">
							<input
								type="checkbox"
								bind:checked={enforceLanguageDetection}
								disabled={loading}
								class="peer sr-only"
							/>
							<div
								class="peer h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300"
							></div>
						</label>
					</div>
				</div>
			{/if}

			<!-- Question Suggestions Configuration -->
			<div class="space-y-6">
				<div class="flex items-center space-x-2">
					<i class="fas fa-lightbulb text-yellow-400"></i>
					<h3 class="text-lg font-semibold text-gray-100">Question Suggestions</h3>
				</div>

				<!-- Enable/Disable Toggle -->
				<div
					class="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4"
				>
					<div>
						<h4 class="font-medium text-gray-100">Enable Question Suggestions</h4>
						<p class="text-sm text-gray-400">
							Generate helpful follow-up questions based on conversations
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input
							type="checkbox"
							bind:checked={suggestionsEnabled}
							disabled={loading}
							class="peer sr-only"
						/>
						<div
							class="peer h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300"
						></div>
					</label>
				</div>

				{#if suggestionsEnabled}
					<!-- Suggestions Configuration -->
					<div class="space-y-6 rounded-lg border border-gray-700 bg-gray-800/50 p-6">
						<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<div>
								<label
									class="mb-2 block text-sm font-medium text-gray-300"
									for="edit-suggestions-api-key"
								>
									Suggestions API Key *
								</label>
								<select
									id="edit-suggestions-api-key"
									bind:value={suggestionsApiKeyId}
									disabled={loading}
									class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
								>
									<option value="">Select API key...</option>
									{#each (data.project as any).apiKeys || [] as apiKey}
										<option value={apiKey._id}>{apiKey.name}</option>
									{/each}
								</select>
								<p class="mt-1 text-xs text-gray-500">Can be different from main agent API key</p>
							</div>

							{#if suggestionsProvider}
								<div>
									<label
										class="mb-2 block text-sm font-medium text-gray-300"
										for="edit-suggestions-model"
									>
										Suggestions Model *
									</label>
									<select
										id="edit-suggestions-model"
										bind:value={suggestionsModel}
										disabled={loading}
										class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
									>
										<option value="">Select a model</option>
										{#each suggestionsProvider.models as modelOption}
											<option value={modelOption}>{modelOption}</option>
										{/each}
									</select>
									<p class="mt-1 text-xs text-gray-500">Can be different from main agent model</p>
								</div>
							{/if}
						</div>

						<div>
							<label
								class="mb-2 block text-sm font-medium text-gray-300"
								for="edit-suggestions-count"
							>
								Number of Suggestions: {suggestionsCount}
							</label>
							<input
								id="edit-suggestions-count"
								type="range"
								min="1"
								max="5"
								step="1"
								bind:value={suggestionsCount}
								disabled={loading}
								class="w-full"
							/>
							<div class="mt-1 flex justify-between text-xs text-gray-500">
								<span>1 question</span>
								<span>5 questions</span>
							</div>
						</div>

						<div>
							<label
								class="mb-2 block text-sm font-medium text-gray-300"
								for="edit-suggestions-custom-prompt"
							>
								Custom Prompt (Optional)
							</label>
							<textarea
								id="edit-suggestions-custom-prompt"
								bind:value={suggestionsCustomPrompt}
								placeholder="Generate helpful questions about {`{count}`} topics related to the conversation..."
								rows="3"
								disabled={loading}
								class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							></textarea>
							<p class="mt-1 text-xs text-gray-500">
								Use {`{count}`} as placeholder for the number of questions. If empty, default prompt
								will be used.
							</p>
						</div>
					</div>

					<!-- Suggestions Preview -->
					<div class="rounded-lg bg-blue-500/10 p-4">
						<div class="flex items-start space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
								<i class="fas fa-lightbulb text-sm text-white"></i>
							</div>
							<div>
								<h4 class="font-medium text-blue-400">How suggestions work</h4>
								<p class="text-sm text-blue-300">
									After each conversation, your agent will generate {suggestionsCount} relevant follow-up
									questions to help users continue the conversation naturally.
								</p>
							</div>
						</div>
					</div>
				{:else}
					<!-- Suggestions Disabled Info -->
					<div class="rounded-lg bg-gray-500/10 p-4">
						<div class="flex items-start space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-500">
								<i class="fas fa-info-circle text-sm text-white"></i>
							</div>
							<div>
								<h4 class="font-medium text-gray-400">Suggestions Disabled</h4>
								<p class="text-sm text-gray-500">
									Question suggestions are turned off. Enable them to help users with conversation
									starters.
								</p>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- GDPR Configuration -->
			<div class="space-y-6">
				<div class="flex items-center space-x-2">
					<i class="fas fa-shield-alt text-green-400"></i>
					<h3 class="text-lg font-semibold text-gray-100">GDPR & Data Privacy</h3>
				</div>

				<div
					class="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4"
				>
					<div>
						<h4 class="font-medium text-gray-100">Encrypt Messages</h4>
						<p class="text-sm text-gray-400">
							Encrypt stored conversation messages for enhanced data security
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input
							type="checkbox"
							bind:checked={gdprEncryptMessages}
							disabled={loading}
							class="peer sr-only"
						/>
						<div
							class="peer h-6 w-11 rounded-full bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300"
						></div>
					</label>
				</div>

				<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
					<label
						class="mb-2 block text-sm font-medium text-gray-300"
						for="edit-gdpr-retention-days"
					>
						Data Retention (days)
					</label>
					<input
						id="edit-gdpr-retention-days"
						type="number"
						min="1"
						placeholder="No limit"
						bind:value={gdprRetentionDays}
						disabled={loading}
						class="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
					/>
					<p class="mt-1 text-xs text-gray-500">
						Number of days to retain conversation data. Leave empty for no automatic deletion.
					</p>
				</div>
			</div>

			<!-- Agent Statistics (if available) -->
			{#if agent.conversations_count || agent.executions_count}
				<div class="space-y-6">
					<div class="flex items-center space-x-2">
						<i class="fas fa-chart-bar text-blue-400"></i>
						<h3 class="text-lg font-semibold text-gray-100">Usage Statistics</h3>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
						{#if agent.conversations_count !== undefined}
							<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
								<div class="flex items-center justify-between">
									<div>
										<p class="text-sm text-gray-400">Conversations</p>
										<p class="text-2xl font-bold text-blue-400">{agent.conversations_count}</p>
									</div>
									<i class="fas fa-comments text-blue-400"></i>
								</div>
							</div>
						{/if}

						{#if agent.executions_count !== undefined}
							<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
								<div class="flex items-center justify-between">
									<div>
										<p class="text-sm text-gray-400">Executions</p>
										<p class="text-2xl font-bold text-green-400">{agent.executions_count}</p>
									</div>
									<i class="fas fa-play text-green-400"></i>
								</div>
							</div>
						{/if}

						<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm text-gray-400">Created</p>
									<p class="text-sm font-medium text-gray-200">
										{new Date(agent.createdAt).toLocaleDateString()}
									</p>
								</div>
								<i class="fas fa-calendar text-purple-400"></i>
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if error}
				<div class="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
					<div class="flex items-center space-x-2">
						<i class="fas fa-exclamation-circle text-red-400"></i>
						<p class="text-red-400">{error}</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="sticky bottom-0 border-t border-gray-800 bg-gray-900 p-6">
			<div class="flex justify-end space-x-3">
				<button
					type="button"
					on:click={() => dispatch('close')}
					disabled={loading}
					class="rounded-lg border border-gray-700 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>
					Cancel
				</button>

				<button
					type="button"
					on:click={updateAgent}
					class:disabled={loading ||
						!name.trim() ||
						!model ||
						!(promptMode === 'prompt_sections'
							? Object.values(promptSections).some((v) => v.trim() !== '')
							: systemPrompt.trim()) ||
						!apiKeyId ||
						(suggestionsEnabled && (!suggestionsApiKeyId || !suggestionsModel))}
					class="inline-flex items-center space-x-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-white transition-all hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading}
						<i class="fas fa-spinner fa-spin"></i>
						<span>Updating...</span>
					{:else}
						<i class="fas fa-save"></i>
						<span>Update Agent</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Google Calendar Config Modal -->
{#if showGoogleCalendarConfig}
	<GoogleCalendarConfigModal
		{data}
		{agent}
		on:close={() => (showGoogleCalendarConfig = false)}
		on:configured={() => {
			showGoogleCalendarConfig = false;
		}}
		on:deleted={() => {
			showGoogleCalendarConfig = false;
		}}
	/>
{/if}
