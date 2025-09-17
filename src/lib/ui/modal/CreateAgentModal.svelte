<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { api } from '$lib/api';

	export let data;
	const dispatch = createEventDispatcher();

	let step = 1;
	let loading = false;
	let error = '';

	// Agent basic info
	let name = '';
	let description = '';
	let type = 'chatbot';

	// LLM Settings
	let model = '';
	let systemPrompt = '';
	let apiKeyId = '';
	let temperature = 0.7;
	let maxTokens = 1000;

	// Tools
	let selectedTools = [];

	// Question Suggestions
	let suggestionsEnabled = false;
	let suggestionsCount = 3;
	let suggestionsApiKeyId = '';
	let suggestionsModel = '';
	let suggestionsCustomPrompt = '';

	// Derived provider based on selected API key
	$: provider = apiKeyId
		? (data.project as any).apiKeys?.find((api_key: any) => api_key._id === apiKeyId)?.provider
		: null;

	// Derived provider for suggestions API key
	$: suggestionsProvider = suggestionsApiKeyId
		? (data.project as any).apiKeys?.find((api_key: any) => api_key._id === suggestionsApiKeyId)
				?.provider
		: null;

	const availableTools = [
		{ id: 'web_search', name: 'Web Search', description: 'Search the internet for information' },
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
		}
	];

	function nextStep() {
		if (step < 4) {
			step++;
		}
	}

	function prevStep() {
		if (step > 1) {
			step--;
		}
	}

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
				return 'from-blue-500 to-cyan-500';
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
			default:
				return 'from-indigo-500 to-purple-600';
		}
	}

	// Agent Type icon and color
	function getTypeIcon(agentType) {
		switch (agentType) {
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

	function getTypeColor(agentType) {
		switch (agentType) {
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

	async function createAgent() {
		loading = true;
		error = '';

		try {
			const agentData = {
				name,
				description,
				type,
				system_prompt: systemPrompt,
				api_key: apiKeyId,
				llm_settings: {
					model,
					parameters: {
						temperature,
						max_tokens: maxTokens
					}
				},
				tools: selectedTools,
				is_active: true,
				question_suggestions: {
					enabled: suggestionsEnabled,
					count: suggestionsCount,
					api_key: suggestionsEnabled ? suggestionsApiKeyId : null,
					model: suggestionsEnabled ? suggestionsModel : null,
					custom_prompt:
						suggestionsEnabled && suggestionsCustomPrompt.trim() ? suggestionsCustomPrompt : null
				}
			};

			if (!suggestionsEnabled) {
				delete agentData.question_suggestions;
			}

			const res = await api.fetch(
				`/organizations/${data.organization_id}/projects/${data.project._id}/agents`,
				{
					method: 'POST',
					body: JSON.stringify(agentData)
				}
			);

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || 'Failed to create agent');
			}

			const agent = await res.json();
			dispatch('created', agent);
		} catch (err) {
			error = err.message || 'Something went wrong';
		} finally {
			loading = false;
		}
	}

	function isStepValid(stepNumber) {
		switch (stepNumber) {
			case 1:
				return name.trim() !== '' && type !== '';
			case 2:
				return model !== '' && systemPrompt.trim() !== '' && apiKeyId !== '';
			case 3:
				return true; // Tools are optional
			case 4:
				// Suggestions validation
				if (suggestionsEnabled) {
					return suggestionsApiKeyId !== '' && suggestionsModel !== '';
				}
				return true; // Suggestions are optional
			default:
				return false;
		}
	}
</script>

<!-- BACKDROP -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
	<!-- MODAL -->
	<div class="mx-4 w-full max-w-4xl rounded-xl border border-gray-800 bg-gray-900 shadow-2xl">
		<!-- Header -->
		<div class="border-b border-gray-800 p-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600"
					>
						<i class="fas fa-robot text-white"></i>
					</div>
					<div>
						<h2 class="text-xl font-bold text-white">Create AI Agent</h2>
						<p class="text-sm text-gray-400">Set up a new intelligent agent</p>
					</div>
				</div>
				<button
					on:click={() => dispatch('close')}
					class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-300"
				>
					<i class="fas fa-times"></i>
				</button>
			</div>

			<!-- Progress Steps -->
			<div class="mt-6 flex items-center space-x-4">
				{#each ['Basic Info', 'Configuration', 'Tools', 'Suggestions'] as stepName, index}
					<div class="flex items-center">
						<div class="flex items-center space-x-2">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full {step > index + 1
									? 'bg-green-600'
									: step === index + 1
										? 'bg-indigo-600'
										: 'bg-gray-700'} text-sm font-medium text-white"
							>
								{step > index + 1 ? '✓' : index + 1}
							</div>
							<span
								class="text-sm font-medium {step >= index + 1 ? 'text-gray-200' : 'text-gray-500'}"
							>
								{stepName}
							</span>
						</div>
						{#if index < 3}
							<div class="ml-4 h-0.5 w-8 {step > index + 1 ? 'bg-green-600' : 'bg-gray-700'}"></div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Content -->
		<div class="p-6">
			{#if step === 1}
				<!-- Step 1: Basic Information -->
				<div class="space-y-6">
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-300" for="agent-name">
							Agent Name *
						</label>
						<input
							id="agent-name"
							type="text"
							bind:value={name}
							placeholder="e.g., Customer Support Bot"
							disabled={loading}
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
						<p class="mt-1 text-xs text-gray-500">Choose a descriptive name for your agent</p>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium text-gray-300" for="agent-description">
							Description
						</label>
						<textarea
							id="agent-description"
							bind:value={description}
							placeholder="Describe what this agent does and how it should behave..."
							rows="3"
							disabled={loading}
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						></textarea>
					</div>

					<div>
						<label class="mb-3 block text-sm font-medium text-gray-300"> Agent Type * </label>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{#each ['chatbot', 'task', 'workflow', 'api'] as agentType}
								<button
									type="button"
									on:click={() => (type = agentType)}
									disabled={loading}
									class="relative rounded-lg border-2 p-4 text-left transition-all {type ===
									agentType
										? 'border-indigo-500 bg-indigo-500/10'
										: 'border-gray-700 hover:border-gray-600'}"
								>
									<div class="flex items-center space-x-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r {getTypeColor(
												agentType
											)}"
										>
											<i class="{getTypeIcon(agentType)} text-white"></i>
										</div>
										<div>
											<h3 class="font-medium capitalize text-gray-100">{agentType}</h3>
											<p class="text-sm text-gray-400">
												{#if agentType === 'chatbot'}
													Interactive conversations with users
												{:else if agentType === 'task'}
													Execute specific tasks with input/output
												{:else if agentType === 'workflow'}
													Multi-step automated processes
												{:else if agentType === 'api'}
													API-triggered automated responses
												{/if}
											</p>
										</div>
									</div>
									{#if type === agentType}
										<div class="absolute right-3 top-3">
											<i class="fas fa-check-circle text-indigo-500"></i>
										</div>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				</div>
			{:else if step === 2}
				<!-- Step 2: LLM Configuration -->
				<div class="space-y-6">
					<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<div>
							<label class="mb-2 block text-sm font-medium text-gray-300" for="agent-api-key">
								API Key *
							</label>
							{#if (data.project as any).apiKeys && (data.project as any).apiKeys.length > 0}
								<select
									id="agent-api-key"
									bind:value={apiKeyId}
									disabled={loading}
									class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
								>
									<option value="">Select API key...</option>
									{#each (data.project as any).apiKeys as apiKey}
										<option value={apiKey._id}>{apiKey.name}</option>
									{/each}
								</select>
								<p class="mt-1 text-xs text-gray-500">Choose from project's configured API keys</p>
							{:else}
								<div class="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-400">
									No API keys configured for this project
								</div>
								<p class="mt-1 text-xs text-red-400">
									Configure API keys in project settings first
								</p>
							{/if}
						</div>

						{#if provider}
							<div>
								<label class="mb-2 block text-sm font-medium text-gray-300" for="agent-model">
									LLM Model *
								</label>
								<select
									id="agent-model"
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

					<div>
						<label class="mb-2 block text-sm font-medium text-gray-300" for="agent-system-prompt">
							System Prompt *
						</label>
						<textarea
							id="agent-system-prompt"
							bind:value={systemPrompt}
							placeholder="You are a helpful AI assistant. Your role is to..."
							rows="6"
							disabled={loading}
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						></textarea>
						<p class="mt-1 text-xs text-gray-500">
							Define the agent's personality, role, and behavior
						</p>
					</div>

					<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
						<div>
							<label class="mb-2 block text-sm font-medium text-gray-300" for="agent-temperature">
								Temperature: {temperature}
							</label>
							<input
								id="agent-temperature"
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
							<label class="mb-2 block text-sm font-medium text-gray-300" for="agent-max-tokens">
								Max Tokens
							</label>
							<input
								id="agent-max-tokens"
								type="number"
								min="1"
								max="4096"
								bind:value={maxTokens}
								disabled={loading}
								class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
						</div>
					</div>
				</div>
			{:else if step === 3}
				<!-- Step 3: Tools Configuration -->
				<div class="space-y-6">
					<div class="text-center">
						<h3 class="text-lg font-semibold text-gray-100">Choose Tools</h3>
						<p class="text-sm text-gray-400">
							Select tools that your agent can use to enhance its capabilities
						</p>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{#each availableTools as tool}
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
				</div>
			{:else if step === 4}
				<!-- Step 4: Question Suggestions Configuration -->
				<div class="space-y-6">
					<div class="text-center">
						<h3 class="text-lg font-semibold text-gray-100">Question Suggestions</h3>
						<p class="text-sm text-gray-400">
							Configure smart question suggestions to help users interact with your agent
						</p>
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
										for="suggestions-api-key"
									>
										Suggestions API Key *
									</label>
									{#if (data.project as any).apiKeys && (data.project as any).apiKeys.length > 0}
										<select
											id="suggestions-api-key"
											bind:value={suggestionsApiKeyId}
											disabled={loading}
											class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
										>
											<option value="">Select API key...</option>
											{#each (data.project as any).apiKeys as apiKey}
												<option value={apiKey._id}>{apiKey.name}</option>
											{/each}
										</select>
										<p class="mt-1 text-xs text-gray-500">
											Can be different from main agent API key
										</p>
									{:else}
										<div
											class="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-400"
										>
											No API keys configured for this project
										</div>
									{/if}
								</div>

								{#if suggestionsProvider}
									<div>
										<label
											class="mb-2 block text-sm font-medium text-gray-300"
											for="suggestions-model"
										>
											Suggestions Model *
										</label>
										<select
											id="suggestions-model"
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
								<label class="mb-2 block text-sm font-medium text-gray-300" for="suggestions-count">
									Number of Suggestions: {suggestionsCount}
								</label>
								<input
									id="suggestions-count"
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
									for="suggestions-custom-prompt"
								>
									Custom Prompt (Optional)
								</label>
								<textarea
									id="suggestions-custom-prompt"
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
										Question suggestions are turned off. You can enable them later in agent
										settings.
									</p>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			{#if error}
				<div class="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
					<div class="flex items-center space-x-2">
						<i class="fas fa-exclamation-circle text-red-400"></i>
						<p class="text-red-400">{error}</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="border-t border-gray-800 p-6">
			<div class="flex justify-between">
				<div>
					{#if step > 1}
						<button
							type="button"
							on:click={prevStep}
							disabled={loading}
							class="inline-flex items-center space-x-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
						>
							<i class="fas fa-arrow-left"></i>
							<span>Back</span>
						</button>
					{/if}
				</div>

				<div class="flex space-x-3">
					<button
						type="button"
						on:click={() => dispatch('close')}
						disabled={loading}
						class="rounded-lg border border-gray-700 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
					>
						Cancel
					</button>

					{#if step < 4}
						<button
							type="button"
							on:click={nextStep}
							disabled={loading || !isStepValid(step)}
							class="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<span>Next</span>
							<i class="fas fa-arrow-right"></i>
						</button>
					{:else}
						<button
							type="button"
							on:click={createAgent}
							disabled={loading || !isStepValid(step)}
							class="inline-flex items-center space-x-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-white transition-all hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if loading}
								<i class="fas fa-spinner fa-spin"></i>
								<span>Creating...</span>
							{:else}
								<i class="fas fa-magic"></i>
								<span>Create Agent</span>
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
