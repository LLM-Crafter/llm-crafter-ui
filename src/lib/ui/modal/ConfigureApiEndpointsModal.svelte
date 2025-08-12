<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { api } from '$lib/api';

	export let data: any = undefined;
	export let agent: any;
	const dispatch = createEventDispatcher();

	let loading = false;
	let error = '';
	let endpoints: Record<string, any> = {};
	let authentication: {
		type: string;
		config: Record<string, any>;
	} = {
		type: 'bearer_token',
		config: {}
	};
	let showAddEndpoint = false;

	// New endpoint form
	let newEndpoint = {
		name: '',
		base_url: '',
		path: '',
		methods: ['GET'],
		headers: {} as Record<string, string>,
		description: ''
	};

	// Authentication types
	const authTypes = [
		{ value: 'bearer_token', label: 'Bearer Token' },
		{ value: 'api_key', label: 'API Key' },
		{ value: 'cookie', label: 'Cookie Authentication' }
	];

	const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

	onMount(async () => {
		await loadApiConfig();
	});

	async function loadApiConfig() {
		try {
			loading = true;
			const config = await api.getAgentApiConfig(data.organization_id, data.project._id, agent._id);
			endpoints = config.endpoints || {};
			authentication = {
				type: config.authentication?.type || 'bearer_token',
				config: config.authentication?.config || {}
			};
		} catch (err: any) {
			console.error('Failed to load API configuration:', err);
		} finally {
			loading = false;
		}
	}

	async function saveConfiguration() {
		try {
			loading = true;
			error = '';

			const configData = {
				endpoints,
				authentication
			};

			await api.configureAgentApiEndpoints(
				data.organization_id,
				data.project._id,
				agent._id,
				configData
			);
			await loadApiConfig();
			dispatch('saved');
		} catch (err: any) {
			error = err.message || 'Failed to save configuration';
		} finally {
			loading = false;
		}
	}

	async function addEndpoint() {
		if (!newEndpoint.name.trim() || !newEndpoint.base_url.trim() || !newEndpoint.path.trim()) {
			error = 'Name, Base URL, and Path are required';
			return;
		}

		try {
			loading = true;
			error = '';

			// Add the new endpoint to the endpoints object
			endpoints = {
				...endpoints,
				[newEndpoint.name]: {
					base_url: newEndpoint.base_url,
					path: newEndpoint.path,
					methods: newEndpoint.methods.length > 0 ? newEndpoint.methods : ['GET'],
					headers: newEndpoint.headers,
					description: newEndpoint.description
				}
			};

			// Save the entire configuration
			await saveConfiguration();
			resetNewEndpoint();
			showAddEndpoint = false;
		} catch (err: any) {
			error = err.message || 'Failed to add endpoint';
		} finally {
			loading = false;
		}
	}

	function deleteEndpoint(endpointName: string) {
		if (!confirm('Are you sure you want to delete this endpoint?')) return;

		const { [endpointName]: deleted, ...rest } = endpoints;
		endpoints = rest;
		saveConfiguration();
	}

	function resetNewEndpoint() {
		newEndpoint = {
			name: '',
			base_url: '',
			path: '',
			methods: ['GET'],
			headers: {},
			description: ''
		};
	}

	function toggleMethod(method: string) {
		if (newEndpoint.methods.includes(method)) {
			newEndpoint.methods = newEndpoint.methods.filter((m) => m !== method);
		} else {
			newEndpoint.methods = [...newEndpoint.methods, method];
		}
	}

	function addHeader() {
		const key = prompt('Header name:');
		if (key && key.trim()) {
			const value = prompt('Header value:');
			if (value !== null) {
				newEndpoint.headers = { ...newEndpoint.headers, [key.trim()]: value };
			}
		}
	}

	function removeHeader(key: string) {
		const { [key]: removed, ...rest } = newEndpoint.headers;
		newEndpoint.headers = rest;
	}

	function addAuthHeader() {
		const key = prompt('Header name:');
		if (key && key.trim()) {
			const value = prompt('Header value:');
			if (value !== null) {
				if (!authentication.config) authentication.config = {};
				authentication.config = {
					...authentication.config,
					[key.trim()]: value
				};
			}
		}
	}

	function removeAuthHeader(key: string) {
		if (!authentication.config) return;
		const { [key]: removed, ...rest } = authentication.config;
		authentication.config = rest;
	}
</script>

<!-- BACKDROP -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
	<!-- MODAL -->
	<div
		class="mx-4 max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 shadow-2xl"
	>
		<!-- Header -->
		<div class="sticky top-0 border-b border-gray-800 bg-gray-900 p-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-pink-500"
					>
						<i class="fas fa-plug text-white"></i>
					</div>
					<div>
						<h2 class="text-xl font-bold text-white">Configure API Endpoints</h2>
						<p class="text-sm text-gray-400">Manage API endpoints for {agent.name}</p>
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
		</div>

		<!-- Content -->
		<div class="p-6">
			<!-- Authentication Configuration -->
			<div class="mb-8">
				<h3 class="mb-4 text-lg font-semibold text-gray-100">Authentication Configuration</h3>
				<div class="rounded-lg border border-gray-700 bg-gray-800 p-6">
					<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<div>
							<label class="mb-2 block text-sm font-medium text-gray-300" for="auth-type">
								Authentication Type
							</label>
							<select
								id="auth-type"
								bind:value={authentication.type}
								disabled={loading}
								class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							>
								{#each authTypes as authType}
									<option value={authType.value}>{authType.label}</option>
								{/each}
							</select>
						</div>
					</div>

					<!-- Authentication Configuration -->
					{#if authentication.type === 'bearer_token'}
						<div class="mt-4">
							<label class="mb-2 block text-sm font-medium text-gray-300" for="bearer-token">
								Bearer Token
							</label>
							<input
								id="bearer-token"
								type="password"
								value={authentication.config?.token || ''}
								on:input={(e) => {
									if (!authentication.config) authentication.config = {};
									const target = e.target as HTMLInputElement;
									if (target) authentication.config.token = target.value;
								}}
								placeholder="Enter bearer token"
								disabled={loading}
								class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
						</div>
					{:else if authentication.type === 'api_key'}
						<div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
							<div>
								<label class="mb-2 block text-sm font-medium text-gray-300" for="api-key-name">
									API Key Header Name
								</label>
								<input
									id="api-key-name"
									type="text"
									value={authentication.config?.key_name || ''}
									on:input={(e) => {
										if (!authentication.config) authentication.config = {};
										const target = e.target as HTMLInputElement;
										if (target) authentication.config.key_name = target.value;
									}}
									placeholder="X-API-Key"
									disabled={loading}
									class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
								/>
							</div>
							<div>
								<label class="mb-2 block text-sm font-medium text-gray-300" for="api-key-value">
									API Key Value
								</label>
								<input
									id="api-key-value"
									type="password"
									value={authentication.config?.key_value || ''}
									on:input={(e) => {
										if (!authentication.config) authentication.config = {};
										const target = e.target as HTMLInputElement;
										if (target) authentication.config.key_value = target.value;
									}}
									placeholder="Enter API key"
									disabled={loading}
									class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
								/>
							</div>
						</div>
					{:else if authentication.type === 'cookie'}
						<div class="mt-4">
							<label class="mb-2 block text-sm font-medium text-gray-300" for="cookie-value">
								Cookie Value
							</label>
							<input
								id="cookie-value"
								type="text"
								value={authentication.config?.cookie || ''}
								on:input={(e) => {
									if (!authentication.config) authentication.config = {};
									const target = e.target as HTMLInputElement;
									if (target) authentication.config.cookie = target.value;
								}}
								placeholder="session=abc123; token=xyz789"
								disabled={loading}
								class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
						</div>
					{/if}

					<!-- Additional Authentication Headers -->
					<div class="mt-4">
						<div class="mb-2 flex items-center justify-between">
							<span class="text-sm font-medium text-gray-300">Additional Headers</span>
							<button
								type="button"
								on:click={addAuthHeader}
								disabled={loading}
								class="inline-flex items-center space-x-1 rounded-lg bg-gray-700 px-3 py-1 text-sm text-gray-300 transition-colors hover:bg-gray-600"
							>
								<i class="fas fa-plus"></i>
								<span>Add</span>
							</button>
						</div>
						{#if authentication.config && Object.keys(authentication.config).filter((key) => !['token', 'key_name', 'key_value', 'cookie'].includes(key)).length > 0}
							<div class="space-y-2">
								{#each Object.entries(authentication.config || {}).filter(([key]) => !['token', 'key_name', 'key_value', 'cookie'].includes(key)) as [key, value]}
									<div class="flex items-center space-x-2 rounded-lg bg-gray-700 p-3">
										<span class="font-medium text-gray-300">{key}:</span>
										<span class="text-gray-400">{value}</span>
										<button
											type="button"
											on:click={() => removeAuthHeader(key)}
											class="ml-auto rounded p-1 text-red-400 hover:bg-red-500/10"
											aria-label="Remove header {key}"
										>
											<i class="fas fa-times"></i>
										</button>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-gray-500">No additional headers configured</p>
						{/if}
					</div>

					<div class="mt-6 flex justify-end">
						<button
							type="button"
							on:click={saveConfiguration}
							disabled={loading}
							class="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if loading}
								<i class="fas fa-spinner fa-spin"></i>
								<span>Saving...</span>
							{:else}
								<i class="fas fa-save"></i>
								<span>Save Authentication</span>
							{/if}
						</button>
					</div>
				</div>
			</div>

			<!-- Existing Endpoints -->
			<div class="mb-8">
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold text-gray-100">API Endpoints</h3>
					<button
						on:click={() => (showAddEndpoint = true)}
						class="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					>
						<i class="fas fa-plus"></i>
						<span>Add Endpoint</span>
					</button>
				</div>

				{#if loading}
					<div class="flex items-center justify-center py-8">
						<i class="fas fa-spinner fa-spin text-gray-400"></i>
						<span class="ml-2 text-gray-400">Loading endpoints...</span>
					</div>
				{:else if Object.keys(endpoints).length === 0}
					<div class="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center">
						<i class="fas fa-plug mb-4 text-3xl text-gray-500"></i>
						<h4 class="mb-2 text-lg font-medium text-gray-300">No API endpoints configured</h4>
						<p class="text-gray-500">
							Add your first API endpoint to enable external API calls for this agent.
						</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each Object.entries(endpoints) as [name, endpoint] (name)}
							<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="mb-2 flex items-center space-x-3">
											<h4 class="font-medium text-gray-100">{name}</h4>
											<div class="flex flex-wrap gap-1">
												{#each endpoint.methods || ['GET'] as method}
													<span
														class="inline-flex items-center rounded-md bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-400"
													>
														{method}
													</span>
												{/each}
											</div>
										</div>
										<p class="mb-2 text-sm text-gray-300">{endpoint.base_url}{endpoint.path}</p>
										{#if endpoint.description}
											<p class="text-sm text-gray-500">{endpoint.description}</p>
										{/if}
										{#if Object.keys(endpoint.headers || {}).length > 0}
											<div class="mt-2">
												<p class="text-xs text-gray-400">Headers:</p>
												<div class="ml-2">
													{#each Object.entries(endpoint.headers) as [headerKey, headerValue]}
														<p class="text-xs text-gray-500">{headerKey}: {headerValue}</p>
													{/each}
												</div>
											</div>
										{/if}
									</div>
									<button
										on:click={() => deleteEndpoint(name)}
										disabled={loading}
										class="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500"
										aria-label="Delete endpoint"
									>
										<i class="fas fa-trash"></i>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Add New Endpoint Form -->
			{#if showAddEndpoint}
				<div class="rounded-lg border border-gray-700 bg-gray-800 p-6">
					<div class="mb-4 flex items-center justify-between">
						<h4 class="text-lg font-medium text-gray-100">Add New Endpoint</h4>
						<button
							on:click={() => {
								showAddEndpoint = false;
								resetNewEndpoint();
							}}
							class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-300"
							aria-label="Close add endpoint form"
						>
							<i class="fas fa-times"></i>
						</button>
					</div>

					<div class="space-y-6">
						<!-- Basic Info -->
						<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
							<div>
								<label class="mb-2 block text-sm font-medium text-gray-300" for="endpoint-name">
									Endpoint Name *
								</label>
								<input
									id="endpoint-name"
									type="text"
									bind:value={newEndpoint.name}
									placeholder="e.g., get_weather"
									disabled={loading}
									class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
								/>
							</div>

							<div>
								<label class="mb-2 block text-sm font-medium text-gray-300" for="endpoint-base-url">
									Base URL *
								</label>
								<input
									id="endpoint-base-url"
									type="url"
									bind:value={newEndpoint.base_url}
									placeholder="https://api.example.com"
									disabled={loading}
									class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
								/>
							</div>
						</div>

						<div>
							<label class="mb-2 block text-sm font-medium text-gray-300" for="endpoint-path">
								Path *
							</label>
							<input
								id="endpoint-path"
								type="text"
								bind:value={newEndpoint.path}
								placeholder="/weather/city"
								disabled={loading}
								class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							/>
						</div>

						<div>
							<label
								class="mb-2 block text-sm font-medium text-gray-300"
								for="endpoint-description"
							>
								Description
							</label>
							<textarea
								id="endpoint-description"
								bind:value={newEndpoint.description}
								placeholder="What this endpoint does..."
								rows="2"
								disabled={loading}
								class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
							></textarea>
						</div>

						<!-- HTTP Methods -->
						<div>
							<span class="mb-2 block text-sm font-medium text-gray-300">Allowed HTTP Methods</span>
							<div class="flex flex-wrap gap-2">
								{#each httpMethods as method}
									<button
										type="button"
										on:click={() => toggleMethod(method)}
										disabled={loading}
										class="rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all {newEndpoint.methods.includes(
											method
										)
											? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
											: 'border-gray-600 text-gray-400 hover:border-gray-500'}"
									>
										{method}
									</button>
								{/each}
							</div>
						</div>

						<!-- Custom Headers -->
						<div>
							<div class="mb-2 flex items-center justify-between">
								<span class="text-sm font-medium text-gray-300">Custom Headers</span>
								<button
									type="button"
									on:click={addHeader}
									disabled={loading}
									class="inline-flex items-center space-x-1 rounded-lg bg-gray-700 px-3 py-1 text-sm text-gray-300 transition-colors hover:bg-gray-600"
								>
									<i class="fas fa-plus"></i>
									<span>Add</span>
								</button>
							</div>
							{#if Object.keys(newEndpoint.headers).length > 0}
								<div class="space-y-2">
									{#each Object.entries(newEndpoint.headers) as [key, value]}
										<div class="flex items-center space-x-2 rounded-lg bg-gray-700 p-3">
											<span class="font-medium text-gray-300">{key}:</span>
											<span class="text-gray-400">{value}</span>
											<button
												type="button"
												on:click={() => removeHeader(key)}
												class="ml-auto rounded p-1 text-red-400 hover:bg-red-500/10"
												aria-label="Remove header {key}"
											>
												<i class="fas fa-times"></i>
											</button>
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-sm text-gray-500">No custom headers configured</p>
							{/if}
						</div>
					</div>

					<!-- Form Actions -->
					<div class="mt-6 flex justify-end space-x-3">
						<button
							type="button"
							on:click={() => {
								showAddEndpoint = false;
								resetNewEndpoint();
							}}
							disabled={loading}
							class="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700"
						>
							Cancel
						</button>
						<button
							type="button"
							on:click={addEndpoint}
							disabled={loading ||
								!newEndpoint.name.trim() ||
								!newEndpoint.base_url.trim() ||
								!newEndpoint.path.trim()}
							class="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if loading}
								<i class="fas fa-spinner fa-spin"></i>
								<span>Adding...</span>
							{:else}
								<i class="fas fa-save"></i>
								<span>Add Endpoint</span>
							{/if}
						</button>
					</div>
				</div>
			{/if}

			{#if error}
				<div class="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
					<div class="flex items-center space-x-2">
						<i class="fas fa-exclamation-circle text-red-400"></i>
						<p class="text-red-400">{error}</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
