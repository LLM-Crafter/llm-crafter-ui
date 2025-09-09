<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api, type UserApiKey, type UserApiKeyCreateDTO } from '$lib/api.js';
	import { theme } from '$lib/stores/theme';
	import ApiKeyCard from '$lib/ui/ApiKeyCard.svelte';

	export let data;

	let showCreateForm = false;
	let isCreating = false;
	let searchQuery = '';
	let showApiKeyModal = false;
	let createdApiKey: UserApiKey | null = null;
	let showUsageModal = false;
	let selectedKeyUsage: any = null;

	// Form data
	let form = {
		name: '',
		scopes: [] as string[],
		restrictions: {
			ip_whitelist: '',
			domain_whitelist: '',
			rate_limit_override: '',
			max_executions_per_day: ''
		},
		expires_at: '',
		allowed_projects: [] as string[]
	};

	// Available scopes with descriptions
	const availableScopes = [
		{
			id: 'prompts:execute',
			name: 'Execute Prompts',
			description: 'Execute prompts via external API'
		},
		{
			id: 'agents:read',
			name: 'Read Agents',
			description: 'Read agent configurations and information'
		},
		{
			id: 'agents:execute',
			name: 'Execute Agents',
			description: 'Generate session tokens for agent execution'
		},
		{
			id: 'agents:chat',
			name: 'Agent Chat',
			description: 'Direct agent chat (bypasses session system)'
		},
		{
			id: 'projects:read',
			name: 'Read Projects',
			description: 'Read project information'
		},
		{
			id: 'statistics:read',
			name: 'Read Statistics',
			description: 'Read usage statistics'
		}
	];

	// Filter API keys based on search query
	$: filteredApiKeys = data.apiKeys.filter(
		(key: any) =>
			key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			key.scopes.some((scope: string) => scope.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	function resetForm() {
		form = {
			name: '',
			scopes: [],
			restrictions: {
				ip_whitelist: '',
				domain_whitelist: '',
				rate_limit_override: '',
				max_executions_per_day: ''
			},
			expires_at: '',
			allowed_projects: []
		};
	}

	async function createApiKey() {
		if (!form.name || form.scopes.length === 0) return;

		try {
			isCreating = true;

			const createData: UserApiKeyCreateDTO = {
				name: form.name,
				scopes: form.scopes,
				restrictions: {},
				allowed_projects: form.allowed_projects.length > 0 ? form.allowed_projects : undefined
			};

			// Add restrictions if provided
			if (form.restrictions.ip_whitelist) {
				createData.restrictions!.ip_whitelist = form.restrictions.ip_whitelist
					.split(',')
					.map((ip) => ip.trim())
					.filter((ip) => ip);
			}

			if (form.restrictions.domain_whitelist) {
				createData.restrictions!.domain_whitelist = form.restrictions.domain_whitelist
					.split(',')
					.map((domain) => domain.trim())
					.filter((domain) => domain);
			}

			if (form.restrictions.rate_limit_override) {
				createData.restrictions!.rate_limit_override = parseInt(
					form.restrictions.rate_limit_override
				);
			}

			if (form.restrictions.max_executions_per_day) {
				createData.restrictions!.max_executions_per_day = parseInt(
					form.restrictions.max_executions_per_day
				);
			}

			if (form.expires_at) {
				createData.expires_at = new Date(form.expires_at).toISOString();
			}

			const newKey = await api.createUserApiKey(data.organization_id, createData);

			createdApiKey = newKey;
			showApiKeyModal = true;
			showCreateForm = false;
			resetForm();
			invalidateAll();
		} catch (error) {
			console.error('Failed to create API key:', error);
			alert('Failed to create API key. Please try again.');
		} finally {
			isCreating = false;
		}
	}

	async function rotateApiKey(keyId: string, keyName: string) {
		if (
			!confirm(
				`Are you sure you want to rotate the API key "${keyName}"? The old key will become invalid immediately.`
			)
		) {
			return;
		}

		try {
			const rotatedKey = await api.rotateUserApiKey(data.organization_id, keyId);
			createdApiKey = rotatedKey;
			showApiKeyModal = true;
			invalidateAll();
		} catch (error) {
			console.error('Failed to rotate API key:', error);
			alert('Failed to rotate API key. Please try again.');
		}
	}

	async function revokeApiKey(keyId: string, keyName: string) {
		if (
			!confirm(
				`Are you sure you want to revoke the API key "${keyName}"? This action cannot be undone.`
			)
		) {
			return;
		}

		try {
			await api.revokeUserApiKey(data.organization_id, keyId);
			invalidateAll();
		} catch (error) {
			console.error('Failed to revoke API key:', error);
			alert('Failed to revoke API key. Please try again.');
		}
	}

	async function viewUsage(keyId: string) {
		try {
			const usage = await api.getUserApiKeyUsage(data.organization_id, keyId);
			selectedKeyUsage = usage;
			showUsageModal = true;
		} catch (error) {
			console.error('Failed to fetch usage:', error);
			alert('Failed to fetch usage data. Please try again.');
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(key: any) {
		if (key.is_expired === true) return 'text-red-600';
		if (!key.is_active) return 'text-gray-400';
		if (
			key.expires_at &&
			new Date(key.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
		) {
			return 'text-yellow-600';
		}
		return 'text-green-600';
	}

	function getStatusText(key: any) {
		if (key.is_expired === true) return 'Expired';
		if (!key.is_active) return 'Inactive';
		if (
			key.expires_at &&
			new Date(key.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
		) {
			return 'Expiring Soon';
		}
		return 'Active';
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

<svelte:head>
	<title>API Key Management</title>
</svelte:head>

<div class="mx-auto max-w-7xl p-6">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">API Key Management</h1>
		<p class="text-gray-600 dark:text-gray-400">
			Manage user API keys for external integrations and third-party applications.
		</p>
	</div>

	<!-- Actions Bar -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row">
		<div class="flex-1">
			<input
				type="text"
				placeholder="Search API keys..."
				bind:value={searchQuery}
				class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
			/>
		</div>
		<button
			on:click={() => (showCreateForm = true)}
			class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
		>
			Create API Key
		</button>
	</div>

	<!-- Security Warning -->
	<div
		class="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20"
	>
		<div class="flex">
			<div class="flex-shrink-0">
				<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<div class="ml-3">
				<h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Security Notice</h3>
				<p class="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
					API keys will only be displayed once upon creation. Store them securely and never expose
					them in client-side code.
				</p>
			</div>
		</div>
	</div>

	<!-- API Keys List -->
	<div class="space-y-4">
		{#each filteredApiKeys as key (key._id)}
			<ApiKeyCard
				apiKey={key}
				onViewUsage={viewUsage}
				onRotate={rotateApiKey}
				onRevoke={revokeApiKey}
			/>
		{/each}

		{#if filteredApiKeys.length === 0}
			<div class="py-12 text-center">
				<div class="mb-4 text-gray-400 dark:text-gray-600">
					<svg class="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m0 0a2 2 0 01-2 2m2-2H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-white">No API keys found</h3>
				<p class="mb-4 text-gray-500 dark:text-gray-400">
					{searchQuery
						? 'No API keys match your search criteria.'
						: 'Create your first API key to get started.'}
				</p>
				{#if !searchQuery}
					<button
						on:click={() => (showCreateForm = true)}
						class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						Create API Key
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Create API Key Modal -->
{#if showCreateForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
		<div
			class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-800"
		>
			<h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">Create API Key</h2>

			<form on:submit|preventDefault={createApiKey} class="space-y-4">
				<!-- Name -->
				<div>
					<label for="name" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Name <span class="text-red-500">*</span>
					</label>
					<input
						id="name"
						type="text"
						bind:value={form.name}
						placeholder="My Integration Key"
						maxlength="50"
						required
						class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					/>
					<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
						{form.name.length}/50 characters
					</p>
				</div>

				<!-- Scopes -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Scopes <span class="text-red-500">*</span>
					</label>
					<div class="space-y-2">
						{#each availableScopes as scope}
							<label
								class="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
							>
								<input
									type="checkbox"
									bind:group={form.scopes}
									value={scope.id}
									class="mt-1 text-blue-600 focus:ring-2 focus:ring-blue-500"
								/>
								<div>
									<div class="font-medium text-gray-900 dark:text-white">{scope.name}</div>
									<div class="text-sm text-gray-500 dark:text-gray-400">{scope.description}</div>
								</div>
							</label>
						{/each}
					</div>
				</div>

				<!-- Project Restrictions -->
				{#if data.projects.length > 0}
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Allowed Projects (optional)
						</label>
						<p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
							Leave empty to allow access to all projects
						</p>
						<div class="max-h-32 space-y-2 overflow-y-auto">
							{#each data.projects as project}
								<label class="flex items-center gap-2">
									<input
										type="checkbox"
										bind:group={form.allowed_projects}
										value={project._id}
										class="text-blue-600 focus:ring-2 focus:ring-blue-500"
									/>
									<span class="text-sm text-gray-900 dark:text-white">{project.name}</span>
								</label>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Security Restrictions -->
				<div class="border-t border-gray-200 pt-4 dark:border-gray-600">
					<h3 class="mb-3 text-lg font-medium text-gray-900 dark:text-white">
						Security Restrictions
					</h3>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label
								for="ip_whitelist"
								class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								IP Whitelist
							</label>
							<input
								id="ip_whitelist"
								type="text"
								bind:value={form.restrictions.ip_whitelist}
								placeholder="192.168.1.100, 10.0.0.50"
								class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							/>
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Comma-separated IP addresses
							</p>
						</div>

						<div>
							<label
								for="domain_whitelist"
								class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Domain Whitelist
							</label>
							<input
								id="domain_whitelist"
								type="text"
								bind:value={form.restrictions.domain_whitelist}
								placeholder="myapp.com, api.mycompany.com"
								class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							/>
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Comma-separated domains</p>
						</div>

						<div>
							<label
								for="rate_limit"
								class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Rate Limit Override (req/min)
							</label>
							<input
								id="rate_limit"
								type="number"
								min="1"
								max="1000"
								bind:value={form.restrictions.rate_limit_override}
								placeholder="60 (default)"
								class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							/>
						</div>

						<div>
							<label
								for="daily_limit"
								class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Daily Execution Limit
							</label>
							<input
								id="daily_limit"
								type="number"
								min="1"
								bind:value={form.restrictions.max_executions_per_day}
								placeholder="No limit"
								class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							/>
						</div>
					</div>

					<div class="mt-4">
						<label
							for="expires_at"
							class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Expiration Date (optional)
						</label>
						<input
							id="expires_at"
							type="datetime-local"
							bind:value={form.expires_at}
							min={new Date().toISOString().slice(0, 16)}
							class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
						/>
					</div>
				</div>

				<div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-600">
					<button
						type="button"
						on:click={() => {
							showCreateForm = false;
							resetForm();
						}}
						class="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isCreating || !form.name || form.scopes.length === 0}
						class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isCreating ? 'Creating...' : 'Create API Key'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- API Key Display Modal -->
{#if showApiKeyModal && createdApiKey}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
		<div class="w-full max-w-lg rounded-lg bg-white p-6 dark:bg-gray-800">
			<h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">API Key Created</h2>

			<div
				class="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20"
			>
				<p class="text-sm text-yellow-800 dark:text-yellow-200">
					<strong>Important:</strong> This is the only time you'll see this API key. Copy it now and
					store it securely.
				</p>
			</div>

			<div class="mb-4">
				<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
					API Key
				</label>
				<div class="flex items-center gap-2">
					<code
						class="flex-1 break-all rounded border bg-gray-100 p-3 font-mono text-sm dark:bg-gray-700"
					>
						{createdApiKey.api_key}
					</code>
					<button
						on:click={() => copyToClipboard(createdApiKey.api_key || '')}
						class="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						Copy
					</button>
				</div>
			</div>

			<div class="flex justify-end">
				<button
					on:click={() => {
						showApiKeyModal = false;
						createdApiKey = null;
					}}
					class="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
				>
					I've Saved the Key
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Usage Modal -->
{#if showUsageModal && selectedKeyUsage}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
		<div class="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-gray-800">
			<h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">API Key Usage</h2>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<h3 class="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Current Usage</h3>
					<div class="space-y-3">
						<div>
							<p class="text-sm text-gray-500 dark:text-gray-400">Total Requests</p>
							<p class="text-2xl font-bold text-gray-900 dark:text-white">
								{selectedKeyUsage.usage.total_requests.toLocaleString()}
							</p>
						</div>
						<div>
							<p class="text-sm text-gray-500 dark:text-gray-400">Executions Today</p>
							<p class="text-2xl font-bold text-gray-900 dark:text-white">
								{selectedKeyUsage.usage.executions_today}
							</p>
						</div>
						<div>
							<p class="text-sm text-gray-500 dark:text-gray-400">Last Used</p>
							<p class="text-sm text-gray-900 dark:text-white">
								{selectedKeyUsage.usage.last_used_at
									? formatDate(selectedKeyUsage.usage.last_used_at)
									: 'Never'}
							</p>
						</div>
					</div>
				</div>

				<div>
					<h3 class="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Limits</h3>
					<div class="space-y-3">
						{#if selectedKeyUsage.restrictions?.max_executions_per_day}
							<div>
								<p class="text-sm text-gray-500 dark:text-gray-400">Daily Limit</p>
								<div class="flex items-center gap-2">
									<p class="text-lg font-semibold text-gray-900 dark:text-white">
										{selectedKeyUsage.daily_limit_remaining} / {selectedKeyUsage.restrictions
											.max_executions_per_day}
									</p>
									<span
										class="text-sm {selectedKeyUsage.is_within_daily_limit
											? 'text-green-600'
											: 'text-red-600'}"
									>
										{selectedKeyUsage.is_within_daily_limit ? 'OK' : 'Exceeded'}
									</span>
								</div>
							</div>
						{/if}

						{#if selectedKeyUsage.restrictions?.rate_limit_override}
							<div>
								<p class="text-sm text-gray-500 dark:text-gray-400">Rate Limit</p>
								<p class="text-lg font-semibold text-gray-900 dark:text-white">
									{selectedKeyUsage.restrictions.rate_limit_override} req/min
								</p>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<div class="mt-6 flex justify-end">
				<button
					on:click={() => {
						showUsageModal = false;
						selectedKeyUsage = null;
					}}
					class="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
