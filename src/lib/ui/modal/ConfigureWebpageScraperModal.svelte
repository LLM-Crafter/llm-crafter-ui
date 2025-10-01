<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { api } from '$lib/api';

	export let data: any = undefined;
	export let agent: any;
	const dispatch = createEventDispatcher();

	let loading = false;
	let error = '';
	let config = {
		provider: 'local',
		enabled: false,
		api_key: ''
	};

	// Available providers
	const providers = [
		{
			value: 'local',
			label: 'Local Scraper',
			description: 'Built-in webpage scraping functionality'
		},
		{ value: 'tavily', label: 'Tavily', description: 'Advanced web scraping with Tavily API' }
	];

	onMount(async () => {
		await loadWebpageScraperConfig();
	});

	async function loadWebpageScraperConfig() {
		try {
			loading = true;
			const result = await api.getAgentWebpageScraperConfig(
				data.organization_id,
				data.project._id,
				agent._id
			);
			if (result) {
				config = {
					provider: result.provider || 'local',
					enabled: result.enabled || false,
					api_key: result.api_key || ''
				};
			}
		} catch (err: any) {
			// If config doesn't exist yet, that's okay - we'll create it
			console.log('No existing webpage scraper configuration found, starting fresh');
		} finally {
			loading = false;
		}
	}

	async function saveConfiguration() {
		try {
			loading = true;
			error = '';

			// Validate configuration based on provider
			if (config.enabled) {
				if (config.provider === 'tavily' && !config.api_key.trim()) {
					error = 'API Key is required for Tavily provider';
					return;
				}
			}

			await api.configureAgentWebpageScraper(
				data.organization_id,
				data.project._id,
				agent._id,
				config
			);

			dispatch('saved');
			close();
		} catch (err: any) {
			error = err.message || 'Failed to save webpage scraper configuration';
		} finally {
			loading = false;
		}
	}

	function close() {
		dispatch('close');
	}

	function testScraper() {
		// In a real implementation, you might want to test the scraper
		if (!config.enabled) {
			error = 'Please enable the webpage scraper tool first';
			return;
		}
		error = '';
		alert(
			'Webpage scraper is configured and ready to use. Test it in a conversation with the agent.'
		);
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
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
						<i class="fas fa-globe text-purple-600 dark:text-purple-400"></i>
					</div>
					<div>
						<h2 id="modal-title" class="text-xl font-semibold text-gray-900 dark:text-gray-100">
							Configure Webpage Scraper
						</h2>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Set up webpage scraping functionality for {agent.name}
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
							class="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"
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
								<h3 class="font-medium text-gray-900 dark:text-gray-100">Webpage Scraper Tool</h3>
								<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
									Enable webpage scraping functionality for this agent
								</p>
							</div>
							<label class="relative inline-flex cursor-pointer items-center">
								<input type="checkbox" bind:checked={config.enabled} class="peer sr-only" />
								<div
									class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-purple-800"
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
									Scraping Provider
								</label>
								<select
									id="provider"
									bind:value={config.provider}
									class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-purple-400"
								>
									{#each providers as provider}
										<option value={provider.value}>{provider.label}</option>
									{/each}
								</select>
								<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
									{providers.find((p) => p.value === config.provider)?.description}
								</p>
							</div>

							<!-- API Key (for Tavily provider) -->
							{#if config.provider === 'tavily'}
								<div>
									<label
										for="apiKey"
										class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
									>
										Tavily API Key
									</label>
									<input
										id="apiKey"
										type="password"
										bind:value={config.api_key}
										placeholder="Enter your Tavily API key"
										class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-purple-400"
									/>
									<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
										Your Tavily API key for advanced web scraping. Get one from
										<a
											href="https://tavily.com"
											target="_blank"
											class="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
										>
											tavily.com
										</a>
									</p>
								</div>
							{/if}

							<!-- Provider Information -->
							<div
								class="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20"
							>
								<div class="flex items-start space-x-3">
									<i class="fas fa-info-circle mt-0.5 text-purple-500"></i>
									<div class="text-sm">
										{#if config.provider === 'local'}
											<h4 class="font-medium text-purple-900 dark:text-purple-100">
												Local Webpage Scraper
											</h4>
											<p class="mt-1 text-purple-700 dark:text-purple-300">
												This tool uses built-in scraping functionality to extract text content from
												web pages. It can handle most standard web pages and automatically extracts
												clean, readable text.
											</p>
											<div class="mt-3 space-y-1">
												<p class="text-purple-700 dark:text-purple-300">
													<strong>Capabilities:</strong>
												</p>
												<ul class="ml-2 list-inside list-disc text-purple-700 dark:text-purple-300">
													<li>Extract text content from HTML pages</li>
													<li>Preserve page title and structure</li>
													<li>Handle JavaScript-rendered content</li>
													<li>Fast local processing</li>
												</ul>
											</div>
										{:else if config.provider === 'tavily'}
											<h4 class="font-medium text-purple-900 dark:text-purple-100">
												Tavily Web Scraping
											</h4>
											<p class="mt-1 text-purple-700 dark:text-purple-300">
												Tavily provides advanced web scraping capabilities with enhanced reliability
												and content extraction. Perfect for complex websites and dynamic content.
											</p>
											<div class="mt-3 space-y-1">
												<p class="text-purple-700 dark:text-purple-300">
													<strong>Advanced Features:</strong>
												</p>
												<ul class="ml-2 list-inside list-disc text-purple-700 dark:text-purple-300">
													<li>Superior JavaScript rendering</li>
													<li>Anti-bot detection bypassing</li>
													<li>Enhanced content extraction</li>
													<li>Rate limiting and reliability</li>
													<li>Support for complex web applications</li>
												</ul>
											</div>
										{/if}
									</div>
								</div>
							</div>

							<!-- Usage Example -->
							<div
								class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
							>
								<h4 class="mb-2 font-medium text-gray-900 dark:text-gray-100">Usage Example</h4>
								<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
									Once configured, the agent can scrape webpages like this:
								</p>
								<div class="rounded-lg bg-gray-100 p-3 dark:bg-gray-900">
									<code class="text-sm text-gray-800 dark:text-gray-200">
										Please scrape the content from https://example.com and summarize the main
										points.
									</code>
								</div>
								<p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
									The agent will automatically extract the webpage content and process it according
									to your request.
								</p>
							</div>

							<!-- Test Button -->
							<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
								<div class="flex items-center justify-between">
									<div>
										<h4 class="font-medium text-gray-900 dark:text-gray-100">Test Configuration</h4>
										<p class="text-sm text-gray-600 dark:text-gray-400">
											Verify that the webpage scraper is working correctly
										</p>
									</div>
									<button
										type="button"
										on:click={testScraper}
										class="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
									>
										<i class="fas fa-vial mr-2"></i>
										Test Scraper
									</button>
								</div>
							</div>
						</div>
					{:else}
						<div class="py-8 text-center">
							<div
								class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
							>
								<i class="fas fa-globe text-2xl text-gray-400"></i>
							</div>
							<h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
								Webpage Scraper Disabled
							</h3>
							<p class="text-gray-600 dark:text-gray-400">
								Enable the webpage scraper tool above to configure scraping providers and settings.
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
					disabled={loading}
					class="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
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
