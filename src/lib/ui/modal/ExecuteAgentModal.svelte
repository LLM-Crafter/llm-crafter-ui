<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { api } from '$lib/api';

	export let data;
	export let agent;
	const dispatch = createEventDispatcher();

	let input = '';
	let loading = false;
	let result = null;
	let error = '';

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
				return 'text-indigo-400 bg-indigo-500/10';
		}
	}

	async function executeAgent() {
		if (!input.trim() || loading) return;

		loading = true;
		error = '';
		result = null;

		try {
			const response = await api.executeAgent(data.organization_id, data.project._id, agent._id, {
				input: input,
				user_identifier: 'user-123' // In a real app, this would be the actual user ID
			});

			result = response;
		} catch (err) {
			error = err.message || 'Failed to execute agent';
		} finally {
			loading = false;
		}
	}

	function getTypeIcon(type) {
		switch (type) {
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

	function getTypeColor(type) {
		switch (type) {
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

	function formatTime(timestamp) {
		return new Date(timestamp).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}
</script>

<!-- BACKDROP -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
	<!-- MODAL -->
	<div
		class="mx-4 max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 shadow-2xl"
	>
		<!-- Header -->
		<div class="border-b border-gray-800 p-6">
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
						<h2 class="text-xl font-bold text-white">{agent.name}</h2>
						<p class="text-sm text-gray-400">Execute {agent.type} agent</p>
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
		<div class="space-y-6 p-6">
			<!-- Agent Description -->
			{#if agent.description}
				<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
					<h3 class="mb-2 text-sm font-medium text-gray-300">Agent Description</h3>
					<p class="text-gray-100">{agent.description}</p>
				</div>
			{/if}

			<!-- Input Section -->
			<div class="space-y-4">
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-300" for="agent-input">
						Input *
					</label>
					<textarea
						id="agent-input"
						bind:value={input}
						placeholder="Enter the input for the agent to process..."
						rows="6"
						disabled={loading}
						class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
					></textarea>
					<p class="mt-1 text-xs text-gray-500">
						Describe what you want the agent to do or provide the data it should process
					</p>
				</div>

				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-4 text-sm text-gray-400">
						{#if agent.llm_settings?.model}
							<span class="flex items-center">
								<i class="fas fa-brain mr-1"></i>
								{agent.llm_settings.model}
							</span>
						{/if}
						{#if agent.tools && agent.tools.length > 0}
							<span class="flex items-center">
								<i class="fas fa-tools mr-1"></i>
								{agent.tools.length} tools available
							</span>
						{/if}
					</div>

					<button
						on:click={executeAgent}
						disabled={!input.trim() || loading}
						class="inline-flex items-center space-x-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-2 text-white transition-all hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if loading}
							<i class="fas fa-spinner fa-spin"></i>
							<span>Executing...</span>
						{:else}
							<i class="fas fa-play"></i>
							<span>Execute Agent</span>
						{/if}
					</button>
				</div>
			</div>

			<!-- Results Section -->
			{#if result}
				<div class="space-y-4">
					<h3 class="flex items-center space-x-2 text-lg font-semibold text-gray-100">
						<i class="fas fa-check-circle text-green-400"></i>
						<span>Execution Result</span>
					</h3>

					<!-- Execution Info -->
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm text-gray-400">Status</p>
									<p class="text-lg font-bold text-green-400">
										{result.status || 'Success'}
									</p>
								</div>
								<i class="fas fa-check-circle text-green-400"></i>
							</div>
						</div>

						{#if result.execution_time}
							<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
								<div class="flex items-center justify-between">
									<div>
										<p class="text-sm text-gray-400">Duration</p>
										<p class="text-lg font-bold text-blue-400">
											{result.execution_time}ms
										</p>
									</div>
									<i class="fas fa-clock text-blue-400"></i>
								</div>
							</div>
						{/if}

						{#if result.timestamp}
							<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
								<div class="flex items-center justify-between">
									<div>
										<p class="text-sm text-gray-400">Completed</p>
										<p class="text-sm font-medium text-gray-200">
											{formatTime(result.timestamp)}
										</p>
									</div>
									<i class="fas fa-calendar text-purple-400"></i>
								</div>
							</div>
						{/if}
					</div>

					<!-- Output -->
					<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
						<h4 class="mb-3 flex items-center space-x-2 font-medium text-gray-300">
							<i class="fas fa-output text-green-400"></i>
							<span>Output</span>
						</h4>
						<div
							class="whitespace-pre-wrap rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100"
						>
							{result.output || result.response || 'No output generated'}
						</div>
					</div>

					<!-- Thinking Process -->
					{#if result.thinking}
						<details class="rounded-lg border border-gray-700 bg-gray-800">
							<summary class="cursor-pointer p-4 font-medium text-gray-300 hover:text-gray-100">
								<i class="fas fa-brain mr-2"></i>
								View Thinking Process
							</summary>
							<div class="border-t border-gray-700 p-4">
								<div class="whitespace-pre-wrap rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
									{result.thinking}
								</div>
							</div>
						</details>
					{/if}

					<!-- Tools Used -->
					{#if result.tools_used && result.tools_used.length > 0}
						<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
							<h4 class="mb-3 flex items-center space-x-2 font-medium text-gray-300">
								<i class="fas fa-tools text-indigo-400"></i>
								<span>Tools Used</span>
							</h4>
							<div class="flex flex-wrap gap-2">
								{#each result.tools_used as tool}
									<span
										class="inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium {getToolColor(
											tool
										)}"
									>
										<i class="{getToolIcon(tool)} mr-1"></i>
										{tool}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Action Buttons -->
					<div class="flex items-center space-x-3">
						<button
							on:click={() => {
								result = null;
								input = '';
								error = '';
							}}
							class="inline-flex items-center space-x-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
						>
							<i class="fas fa-redo"></i>
							<span>Run Again</span>
						</button>
						<button
							on:click={() => navigator.clipboard.writeText(result.output || result.response || '')}
							class="inline-flex items-center space-x-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
						>
							<i class="fas fa-copy"></i>
							<span>Copy Output</span>
						</button>
					</div>
				</div>
			{/if}

			<!-- Error Display -->
			{#if error}
				<div class="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
					<div class="flex items-center space-x-2">
						<i class="fas fa-exclamation-triangle text-red-400"></i>
						<h4 class="font-medium text-red-400">Execution Failed</h4>
					</div>
					<p class="mt-2 text-red-300">{error}</p>
					<button
						on:click={() => {
							error = '';
							result = null;
						}}
						class="mt-3 inline-flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
					>
						<i class="fas fa-redo"></i>
						<span>Try Again</span>
					</button>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="border-t border-gray-800 p-6">
			<div class="flex justify-end space-x-3">
				<button
					type="button"
					on:click={() => dispatch('close')}
					class="rounded-lg border border-gray-700 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>
					Close
				</button>
			</div>
		</div>
	</div>
</div>
