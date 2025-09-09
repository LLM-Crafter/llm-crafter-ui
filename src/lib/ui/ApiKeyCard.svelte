<script lang="ts">
	import type { UserApiKey } from '$lib/api';

	export let apiKey: UserApiKey;
	export let onViewUsage: (keyId: string) => void;
	export let onRotate: (keyId: string, keyName: string) => void;
	export let onRevoke: (keyId: string, keyName: string) => void;

	function getStatusColor(key: UserApiKey): string {
		if (key.is_revoked) return 'text-red-600 dark:text-red-400';
		if (key.expires_at && new Date(key.expires_at) < new Date()) {
			return 'text-orange-600 dark:text-orange-400';
		}
		return 'text-green-600 dark:text-green-400';
	}

	function getStatusText(key: UserApiKey): string {
		if (key.is_revoked) return 'Revoked';
		if (key.expires_at && new Date(key.expires_at) < new Date()) return 'Expired';
		return 'Active';
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div
	class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6"
>
	<div class="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
		<div class="flex-1">
			<div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
					{apiKey.name}
				</h3>
				<span
					class="self-start rounded-full px-2 py-1 text-xs font-medium {getStatusColor(
						apiKey
					)} bg-opacity-10 sm:self-auto"
				>
					{getStatusText(apiKey)}
				</span>
			</div>

			<div class="mb-4 space-y-4 sm:grid sm:grid-cols-1 sm:gap-4 sm:space-y-0 md:grid-cols-2">
				<div>
					<p class="mb-1 text-sm text-gray-500 dark:text-gray-400">API Key</p>
					<div class="flex items-center gap-2">
						<code class="break-all rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">
							{apiKey.masked_key}
						</code>
					</div>
				</div>

				<div>
					<p class="mb-1 text-sm text-gray-500 dark:text-gray-400">Scopes</p>
					<div class="flex flex-wrap gap-1">
						{#each apiKey.scopes as scope}
							<span
								class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
							>
								{scope}
							</span>
						{/each}
					</div>
				</div>
			</div>

			{#if apiKey.usage}
				<div class="mb-4 space-y-3 sm:grid sm:grid-cols-1 sm:gap-4 sm:space-y-0 lg:grid-cols-3">
					<div>
						<p class="text-sm text-gray-500 dark:text-gray-400">Total Requests</p>
						<p class="text-lg font-semibold text-gray-900 dark:text-white">
							{apiKey.usage.total_requests.toLocaleString()}
						</p>
					</div>
					<div>
						<p class="text-sm text-gray-500 dark:text-gray-400">Today's Executions</p>
						<p class="text-lg font-semibold text-gray-900 dark:text-white">
							{apiKey.usage.executions_today}
						</p>
					</div>
					<div>
						<p class="text-sm text-gray-500 dark:text-gray-400">Last Used</p>
						<p class="text-sm text-gray-900 dark:text-white">
							{apiKey.usage.last_used_at ? formatDate(apiKey.usage.last_used_at) : 'Never'}
						</p>
					</div>
				</div>
			{/if}

			<div
				class="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400 sm:flex-row sm:items-center sm:gap-4"
			>
				<span>Created: {formatDate(apiKey.created_at)}</span>
				{#if apiKey.expires_at}
					<span>Expires: {formatDate(apiKey.expires_at)}</span>
				{/if}
			</div>
		</div>

		<div class="flex flex-col gap-2 sm:ml-4 sm:flex-row sm:items-center sm:gap-2">
			<button
				on:click={() => onViewUsage(apiKey._id)}
				class="rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
			>
				View Usage
			</button>
			<button
				on:click={() => onRotate(apiKey._id, apiKey.name)}
				class="rounded-md bg-yellow-50 px-3 py-2 text-sm font-medium text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
			>
				Rotate
			</button>
			<button
				on:click={() => onRevoke(apiKey._id, apiKey.name)}
				class="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
			>
				Revoke
			</button>
		</div>
	</div>
</div>
