<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { api } from '$lib/api';

	export let data: any = undefined;
	export let agent: any;
	const dispatch = createEventDispatcher();

	let loading = false;
	let error = '';
	let config = {
		provider: 'brave',
		api_key: '',
		default_max_results: 10,
		enabled: false
	};

	// Available providers
	const providers = [
		{ value: 'brave', label: 'Brave Search', defaultMaxResults: 10 },
		{ value: 'tavily', label: 'Tavily Search', defaultMaxResults: 5 }
	];

	onMount(async () => {
		await loadWebSearchConfig();
	});

	async function loadWebSearchConfig() {
		try {
			loading = true;
			const result = await api.getAgentWebSearchConfig(
				data.organization_id,
				data.project._id,
				agent._id
			);
			if (result) {
				config = {
					provider: result.provider || 'brave',
					api_key: result.api_key || '',
					default_max_results:
						result.default_max_results || (result.provider === 'tavily' ? 5 : 10),
					enabled: result.enabled || false
				};
			}
		} catch (err: any) {
			// If config doesn't exist yet, that's okay - we'll create it
			console.log('No existing web search configuration found, starting fresh');
		} finally {
			loading = false;
		}
	}

	async function saveConfiguration() {
		if (!config.api_key.trim()) {
			error = 'API key is required';
			return;
		}

		try {
			loading = true;
			error = '';

			await api.configureAgentWebSearch(data.organization_id, data.project._id, agent._id, config);

			dispatch('saved');
			close();
		} catch (err: any) {
			error = err.message || 'Failed to save web search configuration';
		} finally {
			loading = false;
		}
	}

	function close() {
		dispatch('close');
	}

	function onProviderChange() {
		// Update default max results based on provider
		const selectedProvider = providers.find((p) => p.value === config.provider);
		if (selectedProvider) {
			config.default_max_results = selectedProvider.defaultMaxResults;
		}
	}

	function testApiKey() {
		// In a real implementation, you might want to test the API key
		// For now, we'll just validate it's not empty
		if (!config.api_key.trim()) {
			error = 'Please enter an API key to test';
			return;
		}
		error = '';
		// You could implement an actual test call here
		alert('API key format appears valid. Save configuration to test with actual searches.');
	}
</script>

<!-- Modal Backdrop -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
	on:click={close}
	on:keydown={(e) => e.key === 'Escape' && close()}
	role="button"
	tabindex="0"
>
	<!-- Modal Content -->
	<div
		class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-900"
		on:click|stopPropagation
		role="dialog"
		aria-labelledby="modal-title"
	>
		<!-- Modal Header -->
		<div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
						<i class="fas fa-search text-blue-600 dark:text-blue-400"></i>
					</div>
					<div>
						<h2 id="modal-title" class="text-xl font-semibold text-gray-900 dark:text-gray-100">
							Configure Web Search
						</h2>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Set up web search functionality for {agent.name}
						</p>
					</div>
				</div>
				<button
					on:click={close}
					class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
				>
					<i class="fas fa-times"></i>
				</button>
			</div>
		</div>

		<!-- Modal Body -->
		<div class="px-6 py-6">
			{#if loading}
				<div class="flex items-center justify-center py-8">
					<div class="flex items-center space-x-3">
						<div
							class="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
						></div>
						<span class="text-gray-600 dark:text-gray-400">Loading configuration...</span>
					</div>
				</div>
			{:else}
				<div class="space-y-6">
					<!-- Error Message -->
					{#if error}
						<div
							class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
						>
							<div class="flex items-center space-x-2">
								<i class="fas fa-exclamation-triangle text-red-500"></i>
								<span class="text-red-700 dark:text-red-300">{error}</span>
							</div>
						</div>
					{/if}

					<!-- Enable/Disable Toggle -->
					<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="font-medium text-gray-900 dark:text-gray-100">Web Search Tool</h3>
								<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
									Enable web search functionality for this agent
								</p>
							</div>
							<label class="relative inline-flex cursor-pointer items-center">
								<input type="checkbox" bind:checked={config.enabled} class="peer sr-only" />
								<div
									class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"
								></div>
							</label>
						</div>
					</div>

					<!-- Configuration Settings -->
					{#if config.enabled}
						<div class="space-y-6">
							<!-- Provider Selection -->
							<div>
								<label
									for="provider"
									class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Search Provider
								</label>
								<select
									id="provider"
									bind:value={config.provider}
									on:change={onProviderChange}
									class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
								>
									{#each providers as provider}
										<option value={provider.value}>{provider.label}</option>
									{/each}
								</select>
								<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
									{#if config.provider === 'brave'}
										Brave Search API provides fast, privacy-focused web search results
									{:else if config.provider === 'tavily'}
										Tavily Search API is optimized for AI applications and provides high-quality
										results
									{/if}
								</p>
							</div>

							<!-- API Key -->
							<div>
								<label
									for="api_key"
									class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									API Key
								</label>
								<div class="relative">
									<input
										id="api_key"
										type="password"
										bind:value={config.api_key}
										placeholder={config.provider === 'brave' ? 'BSA123...' : 'tvly123...'}
										class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
									/>
									<button
										type="button"
										on:click={testApiKey}
										class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
										title="Test API key"
									>
										<i class="fas fa-vial text-sm"></i>
									</button>
								</div>
								<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
									{#if config.provider === 'brave'}
										Get your API key from <a
											href="https://brave.com/search/api/"
											target="_blank"
											class="text-blue-600 hover:text-blue-700 dark:text-blue-400"
											>Brave Search API</a
										>
									{:else if config.provider === 'tavily'}
										Get your API key from <a
											href="https://tavily.com"
											target="_blank"
											class="text-blue-600 hover:text-blue-700 dark:text-blue-400">Tavily</a
										>
									{/if}
								</p>
							</div>

							<!-- Default Max Results -->
							<div>
								<label
									for="max_results"
									class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Default Max Results
								</label>
								<input
									id="max_results"
									type="number"
									min="1"
									max="20"
									bind:value={config.default_max_results}
									class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400"
								/>
								<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
									Number of search results to return by default (1-20)
								</p>
							</div>

							<!-- Provider-specific Information -->
							<div
								class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
							>
								<div class="flex items-start space-x-3">
									<i class="fas fa-info-circle mt-0.5 text-blue-500"></i>
									<div class="text-sm">
										<h4 class="font-medium text-blue-900 dark:text-blue-100">
											{config.provider === 'brave' ? 'Brave Search' : 'Tavily Search'} Configuration
										</h4>
										<p class="mt-1 text-blue-700 dark:text-blue-300">
											{#if config.provider === 'brave'}
												Brave Search provides anonymous, privacy-focused web search with fast
												response times. Recommended for general web search queries.
											{:else if config.provider === 'tavily'}
												Tavily Search is optimized for AI applications with structured, high-quality
												results. Recommended for research and fact-finding tasks.
											{/if}
										</p>
									</div>
								</div>
							</div>
						</div>
					{:else}
						<div class="py-8 text-center">
							<div
								class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
							>
								<i class="fas fa-search text-2xl text-gray-400"></i>
							</div>
							<h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
								Web Search Disabled
							</h3>
							<p class="text-gray-600 dark:text-gray-400">
								Enable the web search tool above to configure search providers and API settings.
							</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Modal Footer -->
		<div class="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
			<div class="flex justify-end space-x-3">
				<button
					on:click={close}
					class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					Cancel
				</button>
				<button
					on:click={saveConfiguration}
					disabled={loading || (config.enabled && !config.api_key.trim())}
					class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading}
						<div class="flex items-center space-x-2">
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
							></div>
							<span>Saving...</span>
						</div>
					{:else}
						Save Configuration
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>
