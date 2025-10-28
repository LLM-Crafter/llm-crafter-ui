<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { api } from '$lib/api';

	export let data;
	export let agent;
	const dispatch = createEventDispatcher();

	let loading = false;
	let error = '';
	let success = '';

	// Configuration state
	let calendarId = 'primary';
	let timezone = 'UTC';
	let userEmail = '';
	let accessToken = '';
	let refreshToken = '';

	// Config status
	let isConfigured = false;
	let hasAccessToken = false;
	let hasRefreshToken = false;
	let configuredAt = null;

	// Loading state for fetching config
	let fetchingConfig = true;

	// Google OAuth Configuration
	const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
	const GOOGLE_REDIRECT_URI =
		import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin + '/auth/google/callback';
	const GOOGLE_SCOPES = [
		'https://www.googleapis.com/auth/calendar',
		'https://www.googleapis.com/auth/calendar.events'
	].join(' ');

	// Common timezones
	const commonTimezones = [
		'UTC',
		'America/New_York',
		'America/Chicago',
		'America/Denver',
		'America/Los_Angeles',
		'America/Sao_Paulo',
		'Europe/London',
		'Europe/Paris',
		'Europe/Berlin',
		'Asia/Tokyo',
		'Asia/Shanghai',
		'Asia/Dubai',
		'Australia/Sydney'
	];

	// Fetch existing configuration on mount
	async function fetchConfig() {
		fetchingConfig = true;
		error = '';

		try {
			const res = await api.fetch(
				`/organizations/${data.organization_id}/projects/${data.project._id}/agents/${agent._id}/google-calendar-config`,
				{
					method: 'GET'
				}
			);

			if (res.ok) {
				const configData = await res.json();
				if (configData.configured && configData.config) {
					isConfigured = true;
					calendarId = configData.config.calendar_id || 'primary';
					timezone = configData.config.timezone || 'UTC';
					userEmail = configData.config.user_email || '';
					hasAccessToken = configData.config.has_access_token || false;
					hasRefreshToken = configData.config.has_refresh_token || false;
					configuredAt = configData.config.configured_at;
				}
			}
		} catch (err) {
			console.error('Failed to fetch Google Calendar config:', err);
		} finally {
			fetchingConfig = false;
		}
	}

	// Initialize on mount
	fetchConfig();

	function openGoogleOAuthPopup() {
		const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
		authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
		authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
		authUrl.searchParams.set('response_type', 'code');
		authUrl.searchParams.set('scope', GOOGLE_SCOPES);
		authUrl.searchParams.set('access_type', 'offline');
		authUrl.searchParams.set('prompt', 'consent');

		const width = 600;
		const height = 700;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;

		const popup = window.open(
			authUrl.toString(),
			'Google OAuth',
			`width=${width},height=${height},left=${left},top=${top}`
		);

		// Listen for the OAuth callback
		const handleMessage = (event: MessageEvent) => {
			// Verify origin for security
			if (event.origin !== window.location.origin) {
				return;
			}

			if (event.data.type === 'google-oauth-success') {
				accessToken = event.data.access_token;
				refreshToken = event.data.refresh_token || '';
				userEmail = event.data.email || '';
				success = 'Successfully authenticated with Google! Saving configuration...';
				window.removeEventListener('message', handleMessage);
				popup?.close();

				// Automatically save the configuration
				saveConfiguration();
			} else if (event.data.type === 'google-oauth-error') {
				error = event.data.error || 'Failed to authenticate with Google';
				window.removeEventListener('message', handleMessage);
				popup?.close();
			}
		};

		window.addEventListener('message', handleMessage);

		// Clean up listener if popup is closed manually
		const checkPopupClosed = setInterval(() => {
			if (popup?.closed) {
				clearInterval(checkPopupClosed);
				window.removeEventListener('message', handleMessage);
			}
		}, 1000);
	}

	async function saveConfiguration() {
		loading = true;
		error = '';
		success = '';

		try {
			if (!accessToken && !isConfigured) {
				throw new Error('Please authenticate with Google first');
			}

			const configData: any = {
				calendar_id: calendarId,
				timezone: timezone,
				user_email: userEmail || undefined
			};

			// Include the tokens if we have new ones
			if (accessToken) {
				configData.access_token = accessToken;
			}
			if (refreshToken) {
				configData.refresh_token = refreshToken;
			}

			const res = await api.fetch(
				`/organizations/${data.organization_id}/projects/${data.project._id}/agents/${agent._id}/google-calendar-config`,
				{
					method: 'POST',
					body: JSON.stringify(configData)
				}
			);

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || 'Failed to save configuration');
			}

			const result = await res.json();
			success = result.message || 'Configuration saved successfully!';

			// Update local state
			isConfigured = true;
			hasAccessToken = result.config.has_access_token;
			hasRefreshToken = result.config.has_refresh_token;
			configuredAt = result.config.configured_at;
			if (result.config.user_email) {
				userEmail = result.config.user_email;
			}

			// Clear tokens from memory
			accessToken = '';
			refreshToken = '';

			// Notify parent
			dispatch('configured', result.config);
		} catch (err) {
			error = err.message || 'Something went wrong';
		} finally {
			loading = false;
		}
	}

	async function deleteConfiguration() {
		if (
			!confirm(
				'Are you sure you want to remove Google Calendar configuration? This will revoke access to the calendar.'
			)
		) {
			return;
		}

		loading = true;
		error = '';
		success = '';

		try {
			const res = await api.fetch(
				`/organizations/${data.organization_id}/projects/${data.project._id}/agents/${agent._id}/google-calendar-config`,
				{
					method: 'DELETE'
				}
			);

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || 'Failed to delete configuration');
			}

			success = 'Configuration deleted successfully!';

			// Reset state
			isConfigured = false;
			hasAccessToken = false;
			hasRefreshToken = false;
			configuredAt = null;
			calendarId = 'primary';
			timezone = 'UTC';
			userEmail = '';
			accessToken = '';
			refreshToken = '';

			// Notify parent
			dispatch('deleted');
		} catch (err) {
			error = err.message || 'Something went wrong';
		} finally {
			loading = false;
		}
	}
</script>

<!-- BACKDROP -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
	<!-- MODAL -->
	<div
		class="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 shadow-2xl"
	>
		<!-- Header -->
		<div class="sticky top-0 border-b border-gray-800 bg-gray-900 p-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-yellow-500"
					>
						<i class="fab fa-google text-white"></i>
					</div>
					<div>
						<h2 class="text-xl font-bold text-white">Google Calendar Configuration</h2>
						<p class="text-sm text-gray-400">Connect your Google Calendar to {agent.name}</p>
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
			{#if fetchingConfig}
				<div class="flex items-center justify-center py-8">
					<i class="fas fa-spinner fa-spin text-2xl text-indigo-500"></i>
				</div>
			{:else}
				<!-- Configuration Status -->
				{#if isConfigured}
					<div class="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
						<div class="flex items-start space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
								<i class="fas fa-check text-sm text-white"></i>
							</div>
							<div class="flex-1">
								<h4 class="font-medium text-green-400">Google Calendar Connected</h4>
								<p class="text-sm text-green-300">
									This agent is connected to Google Calendar
									{#if userEmail}for <strong>{userEmail}</strong>{/if}
								</p>
								{#if configuredAt}
									<p class="mt-1 text-xs text-green-400">
										Configured on {new Date(configuredAt).toLocaleString()}
									</p>
								{/if}
								<div class="mt-2 flex gap-2 text-xs">
									<span
										class="inline-flex items-center rounded-md bg-green-500/20 px-2 py-1 text-green-400"
									>
										<i class="fas fa-key mr-1"></i>
										Access Token: {hasAccessToken ? 'Connected' : 'Missing'}
									</span>
									<span
										class="inline-flex items-center rounded-md bg-green-500/20 px-2 py-1 text-green-400"
									>
										<i class="fas fa-sync mr-1"></i>
										Refresh Token: {hasRefreshToken ? 'Connected' : 'Missing'}
									</span>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
						<div class="flex items-start space-x-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500">
								<i class="fas fa-exclamation-triangle text-sm text-white"></i>
							</div>
							<div>
								<h4 class="font-medium text-yellow-400">Not Configured</h4>
								<p class="text-sm text-yellow-300">
									Please authenticate with Google Calendar to enable this tool
								</p>
							</div>
						</div>
					</div>
				{/if}

				<!-- OAuth Authentication -->
				<div class="space-y-4">
					<div class="flex items-center space-x-2">
						<i class="fas fa-shield-alt text-indigo-400"></i>
						<h3 class="text-lg font-semibold text-gray-100">OAuth Authentication</h3>
					</div>

					{#if !GOOGLE_CLIENT_ID}
						<div class="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
							<div class="flex items-start space-x-3">
								<i class="fas fa-exclamation-circle text-red-400"></i>
								<div>
									<h4 class="font-medium text-red-400">Configuration Error</h4>
									<p class="text-sm text-red-300">
										Google OAuth Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in
										your environment variables.
									</p>
								</div>
							</div>
						</div>
					{:else}
						<button
							type="button"
							on:click={openGoogleOAuthPopup}
							disabled={loading}
							class="flex w-full items-center justify-center space-x-3 rounded-lg border border-gray-700 bg-white px-6 py-3 text-gray-900 transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<i class="fab fa-google text-xl"></i>
							<span class="font-medium">
								{isConfigured ? 'Re-authenticate with Google' : 'Sign in with Google'}
							</span>
						</button>

						<p class="text-center text-xs text-gray-500">
							You'll be asked to grant permission to access your Google Calendar
						</p>
					{/if}
				</div>

				<!-- Calendar Configuration -->
				<div class="space-y-4">
					<div class="flex items-center space-x-2">
						<i class="fas fa-cog text-purple-400"></i>
						<h3 class="text-lg font-semibold text-gray-100">Calendar Settings</h3>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium text-gray-300" for="calendar-id">
							Calendar ID
						</label>
						<input
							id="calendar-id"
							type="text"
							bind:value={calendarId}
							placeholder="primary"
							disabled={loading}
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
						<p class="mt-1 text-xs text-gray-500">
							Use "primary" for the main calendar, or specify a calendar ID
						</p>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium text-gray-300" for="timezone">
							Timezone
						</label>
						<select
							id="timezone"
							bind:value={timezone}
							disabled={loading}
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						>
							{#each commonTimezones as tz}
								<option value={tz}>{tz}</option>
							{/each}
						</select>
						<p class="mt-1 text-xs text-gray-500">
							Timezone for creating and displaying calendar events
						</p>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium text-gray-300" for="user-email">
							User Email (Optional)
						</label>
						<input
							id="user-email"
							type="email"
							bind:value={userEmail}
							placeholder="user@example.com"
							disabled={loading}
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
						<p class="mt-1 text-xs text-gray-500">
							Email for reference (will be auto-filled if you sign in with Google)
						</p>
					</div>
				</div>

				<!-- Info Box -->
				<div class="rounded-lg bg-blue-500/10 p-4">
					<div class="flex items-start space-x-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
							<i class="fas fa-info-circle text-sm text-white"></i>
						</div>
						<div>
							<h4 class="font-medium text-blue-400">Security & Privacy</h4>
							<ul class="mt-2 space-y-1 text-sm text-blue-300">
								<li>• All tokens are encrypted using AES-256 before storage</li>
								<li>• Tokens are only decrypted during tool execution</li>
								<li>• You can revoke access anytime by deleting the configuration</li>
								<li>• Refresh tokens allow long-term access without re-authentication</li>
							</ul>
						</div>
					</div>
				</div>

				{#if error}
					<div class="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
						<div class="flex items-center space-x-2">
							<i class="fas fa-exclamation-circle text-red-400"></i>
							<p class="text-red-400">{error}</p>
						</div>
					</div>
				{/if}

				{#if success}
					<div class="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
						<div class="flex items-center space-x-2">
							<i class="fas fa-check-circle text-green-400"></i>
							<p class="text-green-400">{success}</p>
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Footer -->
		<div class="sticky bottom-0 border-t border-gray-800 bg-gray-900 p-6">
			<div class="flex justify-between">
				<div>
					{#if isConfigured}
						<button
							type="button"
							on:click={deleteConfiguration}
							disabled={loading}
							class="rounded-lg border border-red-500/50 px-4 py-2 text-red-400 transition-colors hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<i class="fas fa-trash mr-2"></i>
							Delete Configuration
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
						Close
					</button>

					<button
						type="button"
						on:click={saveConfiguration}
						disabled={loading || fetchingConfig}
						class="inline-flex items-center space-x-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 text-white transition-all hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if loading}
							<i class="fas fa-spinner fa-spin"></i>
							<span>Saving...</span>
						{:else}
							<i class="fas fa-save"></i>
							<span>Save Configuration</span>
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
