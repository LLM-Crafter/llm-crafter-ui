<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { api } from '$lib/api';

	export let data;
	export let agent;
	const dispatch = createEventDispatcher();

	let loading = false;
	let error = '';

	// Initialize values from existing agent
	let name = agent.name || '';
	let description = agent.description || '';
	let systemPrompt = agent.system_prompt || '';
	let apiKeyId = agent.api_key || '';
	let temperature = agent.llm_settings?.parameters?.temperature || 0.7;
	let maxTokens = agent.llm_settings?.parameters?.max_tokens || 1000;
	let model = agent.llm_settings?.model || '';
	let isActive = agent.is_active !== undefined ? agent.is_active : true;
	let selectedTools = agent.tools.map((tool) => tool.name) || [];

	// Derived provider based on selected API key
	$: provider = apiKeyId
		? (data.project as any).apiKeys?.find((api_key: any) => api_key._id === apiKeyId)?.provider
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
		}
	];

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
				is_active: isActive
			};

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
			</div>

			<!-- Tools Configuration -->
			<div class="space-y-6">
				<div class="flex items-center space-x-2">
					<i class="fas fa-tools text-green-400"></i>
					<h3 class="text-lg font-semibold text-gray-100">Tools & Capabilities</h3>
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
					disabled={loading || !name.trim() || !model || !systemPrompt.trim() || !apiKeyId}
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
