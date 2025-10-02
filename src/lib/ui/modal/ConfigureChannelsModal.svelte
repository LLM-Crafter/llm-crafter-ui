<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { api } from '$lib/api';

	export let data: any = undefined;
	export let agent: any;
	const dispatch = createEventDispatcher();

	let loading = false;
	let error = '';
	let successMessage = '';
	let activeChannel: 'whatsapp' | 'telegram' | 'email' | null = null;
	let testingChannel: string | null = null;
	let testSuccess = '';
	let testError = '';
	let webhookUrls = {
		whatsapp: '',
		telegram: '',
		email: ''
	};
	let customWebhookUrl = ''; // Editable webhook URL for manual setup
	let showWebhookInfo = false;

	// Channel configurations
	let whatsappConfig = {
		enabled: false,
		provider: 'twilio' as 'twilio' | 'meta' | '360dialog',
		// Twilio
		account_sid: '',
		auth_token: '',
		phone_number: '',
		verify_token: '',
		// Meta
		phone_number_id: '',
		access_token: '',
		business_account_id: '',
		// 360Dialog
		api_key: '',
		client_id: ''
	};

	let telegramConfig = {
		enabled: false,
		bot_token: '',
		bot_username: ''
	};

	let emailConfig = {
		enabled: false,
		provider: 'smtp' as 'smtp' | 'sendgrid' | 'mailgun' | 'ses',
		// SMTP
		smtp_host: '',
		smtp_port: 587,
		smtp_secure: false,
		smtp_user: '',
		smtp_password: '',
		// SendGrid
		sendgrid_api_key: '',
		// Mailgun
		mailgun_api_key: '',
		mailgun_domain: '',
		// AWS SES
		ses_region: 'us-east-1',
		ses_access_key_id: '',
		ses_secret_access_key: '',
		// Common
		from_email: '',
		from_name: ''
	};

	let channelAnalytics: any = null;

	const whatsappProviders = [
		{ value: 'twilio', label: 'Twilio' },
		{ value: 'meta', label: 'Meta Cloud API' },
		{ value: '360dialog', label: '360Dialog' }
	];

	const emailProviders = [
		{ value: 'smtp', label: 'SMTP' },
		{ value: 'sendgrid', label: 'SendGrid' },
		{ value: 'mailgun', label: 'Mailgun' },
		{ value: 'ses', label: 'AWS SES' }
	];

	onMount(async () => {
		await loadChannelConfig();
	});

	async function loadChannelConfig() {
		try {
			loading = true;
			const response = await api.getChannelConfig(
				data.organization_id,
				data.project._id,
				agent._id
			);

			// API returns direct data object, not wrapped in { success, data }
			// Exception: 404 returns { success: true, data: null }
			const config = response.data || response;

			if (config) {
				// Load WhatsApp config
				if (config.whatsapp) {
					whatsappConfig = {
						enabled: config.whatsapp.enabled || false,
						provider: config.whatsapp.provider || 'twilio',
						account_sid: config.whatsapp.account_sid || '',
						auth_token:
							config.whatsapp.auth_token === '***REDACTED***' ||
							config.whatsapp.auth_token?.startsWith('encrypted:')
								? ''
								: config.whatsapp.auth_token || '',
						phone_number: config.whatsapp.phone_number || '',
						verify_token: config.whatsapp.verify_token || '',
						phone_number_id: config.whatsapp.phone_number_id || '',
						access_token:
							config.whatsapp.access_token === '***REDACTED***' ||
							config.whatsapp.access_token?.startsWith('encrypted:')
								? ''
								: config.whatsapp.access_token || '',
						business_account_id: config.whatsapp.business_account_id || '',
						api_key:
							config.whatsapp.api_key === '***REDACTED***' ||
							config.whatsapp.api_key?.startsWith('encrypted:')
								? ''
								: config.whatsapp.api_key || '',
						client_id: config.whatsapp.client_id || ''
					};
					if (config.whatsapp.webhook_url) webhookUrls.whatsapp = config.whatsapp.webhook_url;
				}

				// Load Telegram config
				if (config.telegram) {
					telegramConfig = {
						enabled: config.telegram.enabled || false,
						bot_token:
							config.telegram.bot_token === '***REDACTED***' ||
							config.telegram.bot_token?.startsWith('encrypted:')
								? ''
								: config.telegram.bot_token || '',
						bot_username: config.telegram.bot_username || ''
					};
					if (config.telegram.webhook_url) {
						webhookUrls.telegram = config.telegram.webhook_url;
						customWebhookUrl = config.telegram.webhook_url; // Initialize editable webhook URL
					} else {
						customWebhookUrl = getWebhookUrl('telegram'); // Use default if not set
					}
				} // Load Email config
				if (config.email) {
					emailConfig = {
						enabled: config.email.enabled || false,
						provider: config.email.provider || 'smtp',
						smtp_host: config.email.smtp_host || '',
						smtp_port: config.email.smtp_port || 587,
						smtp_secure: config.email.smtp_secure || false,
						smtp_user: config.email.smtp_user || '',
						smtp_password:
							config.email.smtp_password === '***REDACTED***' ||
							config.email.smtp_password?.startsWith('encrypted:')
								? ''
								: config.email.smtp_password || '',
						sendgrid_api_key:
							config.email.api_key === '***REDACTED***' ||
							config.email.api_key?.startsWith('encrypted:')
								? ''
								: config.email.api_key || '',
						mailgun_api_key:
							config.email.api_key === '***REDACTED***' ||
							config.email.api_key?.startsWith('encrypted:')
								? ''
								: config.email.api_key || '',
						mailgun_domain: config.email.domain || '',
						ses_region: config.email.region || 'us-east-1',
						ses_access_key_id:
							config.email.access_key_id === '***REDACTED***' ||
							config.email.access_key_id?.startsWith('encrypted:')
								? ''
								: config.email.access_key_id || '',
						ses_secret_access_key:
							config.email.secret_access_key === '***REDACTED***' ||
							config.email.secret_access_key?.startsWith('encrypted:')
								? ''
								: config.email.secret_access_key || '',
						from_email: config.email.from_email || '',
						from_name: config.email.from_name || ''
					};
					if (config.email.webhook_url) webhookUrls.email = config.email.webhook_url;
				}

				// Load analytics
				channelAnalytics = config.analytics || null;
			}
		} catch (err: any) {
			console.error('Failed to load channel configuration:', err);
			error = err.message || 'Failed to load channel configuration';
		} finally {
			loading = false;
		}
	}

	async function saveChannelConfig(channel: 'whatsapp' | 'telegram' | 'email') {
		try {
			loading = true;
			error = '';
			successMessage = '';

			let configData: any = {};

			if (channel === 'whatsapp') {
				configData.whatsapp = {
					enabled: whatsappConfig.enabled,
					provider: whatsappConfig.provider
				};

				if (whatsappConfig.provider === 'twilio') {
					configData.whatsapp.account_sid = whatsappConfig.account_sid;
					if (whatsappConfig.auth_token) configData.whatsapp.auth_token = whatsappConfig.auth_token;
					configData.whatsapp.phone_number = whatsappConfig.phone_number;
					if (whatsappConfig.verify_token)
						configData.whatsapp.verify_token = whatsappConfig.verify_token;
				} else if (whatsappConfig.provider === 'meta') {
					configData.whatsapp.phone_number_id = whatsappConfig.phone_number_id;
					if (whatsappConfig.access_token)
						configData.whatsapp.access_token = whatsappConfig.access_token;
					if (whatsappConfig.verify_token)
						configData.whatsapp.verify_token = whatsappConfig.verify_token;
					if (whatsappConfig.business_account_id)
						configData.whatsapp.business_account_id = whatsappConfig.business_account_id;
				} else if (whatsappConfig.provider === '360dialog') {
					if (whatsappConfig.api_key) configData.whatsapp.api_key = whatsappConfig.api_key;
					if (whatsappConfig.client_id) configData.whatsapp.client_id = whatsappConfig.client_id;
					configData.whatsapp.phone_number = whatsappConfig.phone_number;
				}
			} else if (channel === 'telegram') {
				configData.telegram = {
					enabled: telegramConfig.enabled
				};
				if (telegramConfig.bot_token) configData.telegram.bot_token = telegramConfig.bot_token;
				if (telegramConfig.bot_username)
					configData.telegram.bot_username = telegramConfig.bot_username;
			} else if (channel === 'email') {
				configData.email = {
					enabled: emailConfig.enabled,
					provider: emailConfig.provider,
					from_email: emailConfig.from_email,
					from_name: emailConfig.from_name
				};

				if (emailConfig.provider === 'smtp') {
					configData.email.smtp_host = emailConfig.smtp_host;
					configData.email.smtp_port = emailConfig.smtp_port;
					configData.email.smtp_secure = emailConfig.smtp_secure;
					configData.email.smtp_user = emailConfig.smtp_user;
					if (emailConfig.smtp_password) configData.email.smtp_password = emailConfig.smtp_password;
				} else if (emailConfig.provider === 'sendgrid') {
					if (emailConfig.sendgrid_api_key) configData.email.api_key = emailConfig.sendgrid_api_key;
				} else if (emailConfig.provider === 'mailgun') {
					if (emailConfig.mailgun_api_key) configData.email.api_key = emailConfig.mailgun_api_key;
					configData.email.domain = emailConfig.mailgun_domain;
				} else if (emailConfig.provider === 'ses') {
					configData.email.region = emailConfig.ses_region;
					if (emailConfig.ses_access_key_id)
						configData.email.access_key_id = emailConfig.ses_access_key_id;
					if (emailConfig.ses_secret_access_key)
						configData.email.secret_access_key = emailConfig.ses_secret_access_key;
				}
			}

			await api.updateChannelConfig(data.organization_id, data.project._id, agent._id, configData);
			successMessage = `${channel.charAt(0).toUpperCase() + channel.slice(1)} configuration saved successfully!`;
			await loadChannelConfig();

			// Show webhook info after saving
			showWebhookInfo = true;

			// Auto-setup webhook for Telegram if enabled
			if (channel === 'telegram' && telegramConfig.enabled && telegramConfig.bot_token) {
				try {
					await api.setupTelegramWebhook(data.organization_id, data.project._id, agent._id);
				} catch (err) {
					console.warn('Failed to auto-setup Telegram webhook:', err);
				}
			}

			dispatch('saved');
		} catch (err: any) {
			error = err.message || 'Failed to save channel configuration';
		} finally {
			loading = false;
		}
	}

	async function testConnection(channel: 'whatsapp' | 'telegram' | 'email') {
		try {
			testingChannel = channel;
			testError = '';
			testSuccess = '';

			const response = await api.testChannelConnection(
				data.organization_id,
				data.project._id,
				agent._id,
				channel
			);

			if (response.success) {
				testSuccess = `${channel.charAt(0).toUpperCase() + channel.slice(1)} connection test successful!`;
			}
		} catch (err: any) {
			testError = err.message || 'Connection test failed';
		} finally {
			testingChannel = null;
		}
	}

	async function setupTelegramWebhook() {
		try {
			loading = true;
			error = '';
			successMessage = '';

			// Use custom webhook URL if provided, otherwise let backend use default
			const webhookUrl = customWebhookUrl.trim() || undefined;
			const result = await api.setupTelegramWebhook(
				data.organization_id,
				data.project._id,
				agent._id,
				webhookUrl
			);
			if (result.webhook_url) {
				webhookUrls.telegram = result.webhook_url;
				customWebhookUrl = result.webhook_url; // Update with actual URL
			}
			successMessage = 'Telegram webhook configured successfully!';
			showWebhookInfo = true;
			await loadChannelConfig(); // Reload to get the webhook URL
		} catch (err: any) {
			error = err.message || 'Failed to setup Telegram webhook';
		} finally {
			loading = false;
		}
	}

	function getWebhookUrl(channel: 'whatsapp' | 'telegram' | 'email'): string {
		// If we already have it from the API, use it
		if (webhookUrls[channel]) return webhookUrls[channel];

		// Otherwise generate it based on API_URL
		const apiUrl = api.getBaseUrl();
		return `${apiUrl}/channels/webhooks/${channel}/${agent._id}`;
	}

	function copyToClipboard(text: string) {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				successMessage = 'Copied to clipboard!';
				setTimeout(() => {
					successMessage = '';
				}, 2000);
			})
			.catch(() => {
				error = 'Failed to copy to clipboard';
				setTimeout(() => {
					error = '';
				}, 2000);
			});
	}

	function formatLastActivity(timestamp: string | null): string {
		if (!timestamp) return 'Never';
		const date = new Date(timestamp);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
		if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
		return 'Just now';
	}

	function close() {
		dispatch('close');
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
	<div
		class="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-900"
	>
		<!-- Header -->
		<div
			class="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900"
		>
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white">
						<i class="fas fa-broadcast-tower mr-2"></i>
						Channel Configuration
					</h2>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
						Configure multi-channel support for your chatbot agent
					</p>
				</div>
				<button
					on:click={close}
					class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
				>
					<i class="fas fa-times text-xl"></i>
				</button>
			</div>

			{#if error}
				<div class="mt-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
					<div class="flex">
						<i class="fas fa-exclamation-circle text-red-400"></i>
						<p class="ml-3 text-sm text-red-700 dark:text-red-400">{error}</p>
					</div>
				</div>
			{/if}

			{#if successMessage}
				<div class="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
					<div class="flex">
						<i class="fas fa-check-circle text-green-400"></i>
						<p class="ml-3 text-sm text-green-700 dark:text-green-400">{successMessage}</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Content -->
		<div class="p-6">
			<!-- Channel Analytics (if available) -->
			{#if channelAnalytics && channelAnalytics.total_messages_by_channel}
				<div class="mb-6 rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20">
					<h3 class="mb-3 text-sm font-semibold text-indigo-900 dark:text-indigo-100">
						<i class="fas fa-chart-line mr-2"></i>Channel Usage
					</h3>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
						{#if channelAnalytics.total_messages_by_channel.whatsapp}
							<div class="rounded-md bg-white p-3 dark:bg-gray-800">
								<div class="text-xs text-gray-600 dark:text-gray-400">WhatsApp</div>
								<div class="text-lg font-bold text-indigo-600 dark:text-indigo-400">
									{channelAnalytics.total_messages_by_channel.whatsapp}
								</div>
								<div class="text-xs text-gray-500">
									Last: {formatLastActivity(channelAnalytics.last_whatsapp_message)}
								</div>
							</div>
						{/if}
						{#if channelAnalytics.total_messages_by_channel.telegram}
							<div class="rounded-md bg-white p-3 dark:bg-gray-800">
								<div class="text-xs text-gray-600 dark:text-gray-400">Telegram</div>
								<div class="text-lg font-bold text-blue-600 dark:text-blue-400">
									{channelAnalytics.total_messages_by_channel.telegram}
								</div>
								<div class="text-xs text-gray-500">
									Last: {formatLastActivity(channelAnalytics.last_telegram_message)}
								</div>
							</div>
						{/if}
						{#if channelAnalytics.total_messages_by_channel.email}
							<div class="rounded-md bg-white p-3 dark:bg-gray-800">
								<div class="text-xs text-gray-600 dark:text-gray-400">Email</div>
								<div class="text-lg font-bold text-green-600 dark:text-green-400">
									{channelAnalytics.total_messages_by_channel.email}
								</div>
								<div class="text-xs text-gray-500">
									Last: {formatLastActivity(channelAnalytics.last_email_message)}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Channel Selection -->
			<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<!-- WhatsApp Card -->
				<button
					on:click={() => (activeChannel = activeChannel === 'whatsapp' ? null : 'whatsapp')}
					class="rounded-lg border-2 p-4 text-left transition-all hover:shadow-md {activeChannel ===
					'whatsapp'
						? 'border-green-500 bg-green-50 dark:bg-green-900/20'
						: 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-3">
							<div class="rounded-full bg-green-500 p-3">
								<i class="fab fa-whatsapp text-xl text-white"></i>
							</div>
							<div>
								<h3 class="font-semibold text-gray-900 dark:text-white">WhatsApp</h3>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									{whatsappConfig.enabled ? 'Enabled' : 'Disabled'}
								</p>
							</div>
						</div>
						<i class="fas fa-chevron-{activeChannel === 'whatsapp' ? 'up' : 'down'} text-gray-400"
						></i>
					</div>
				</button>

				<!-- Telegram Card -->
				<button
					on:click={() => (activeChannel = activeChannel === 'telegram' ? null : 'telegram')}
					class="rounded-lg border-2 p-4 text-left transition-all hover:shadow-md {activeChannel ===
					'telegram'
						? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
						: 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-3">
							<div class="rounded-full bg-blue-500 p-3">
								<i class="fab fa-telegram text-xl text-white"></i>
							</div>
							<div>
								<h3 class="font-semibold text-gray-900 dark:text-white">Telegram</h3>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									{telegramConfig.enabled ? 'Enabled' : 'Disabled'}
								</p>
							</div>
						</div>
						<i class="fas fa-chevron-{activeChannel === 'telegram' ? 'up' : 'down'} text-gray-400"
						></i>
					</div>
				</button>

				<!-- Email Card -->
				<button
					on:click={() => (activeChannel = activeChannel === 'email' ? null : 'email')}
					class="rounded-lg border-2 p-4 text-left transition-all hover:shadow-md {activeChannel ===
					'email'
						? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
						: 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-3">
							<div class="rounded-full bg-purple-500 p-3">
								<i class="fas fa-envelope text-xl text-white"></i>
							</div>
							<div>
								<h3 class="font-semibold text-gray-900 dark:text-white">Email</h3>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									{emailConfig.enabled ? 'Enabled' : 'Disabled'}
								</p>
							</div>
						</div>
						<i class="fas fa-chevron-{activeChannel === 'email' ? 'up' : 'down'} text-gray-400"></i>
					</div>
				</button>
			</div>

			<!-- WhatsApp Configuration -->
			{#if activeChannel === 'whatsapp'}
				<div
					class="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/10"
				>
					<div class="mb-4 flex items-center justify-between">
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
							<i class="fab fa-whatsapp mr-2 text-green-600"></i>WhatsApp Configuration
						</h3>
						<label class="flex items-center space-x-2">
							<input
								type="checkbox"
								bind:checked={whatsappConfig.enabled}
								class="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
							/>
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300"
								>Enable WhatsApp</span
							>
						</label>
					</div>

					<div class="space-y-4">
						<!-- Provider Selection -->
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
								Provider *
							</label>
							<select
								bind:value={whatsappConfig.provider}
								class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
							>
								{#each whatsappProviders as provider}
									<option value={provider.value}>{provider.label}</option>
								{/each}
							</select>
						</div>

						<!-- Twilio Fields -->
						{#if whatsappConfig.provider === 'twilio'}
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Account SID *
									</label>
									<input
										type="text"
										bind:value={whatsappConfig.account_sid}
										placeholder="AC..."
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Auth Token *
									</label>
									<input
										type="password"
										bind:value={whatsappConfig.auth_token}
										placeholder="Leave empty to keep existing"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Phone Number *
									</label>
									<input
										type="text"
										bind:value={whatsappConfig.phone_number}
										placeholder="+1234567890"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Verify Token (Optional)
									</label>
									<input
										type="text"
										bind:value={whatsappConfig.verify_token}
										placeholder="webhook_verification_token"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
							</div>
						{/if}

						<!-- Meta Cloud API Fields -->
						{#if whatsappConfig.provider === 'meta'}
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Phone Number ID *
									</label>
									<input
										type="text"
										bind:value={whatsappConfig.phone_number_id}
										placeholder="123456789012345"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Access Token *
									</label>
									<input
										type="password"
										bind:value={whatsappConfig.access_token}
										placeholder="Leave empty to keep existing"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Verify Token *
									</label>
									<input
										type="text"
										bind:value={whatsappConfig.verify_token}
										placeholder="webhook_verification_token"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Business Account ID (Optional)
									</label>
									<input
										type="text"
										bind:value={whatsappConfig.business_account_id}
										placeholder="987654321098765"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
							</div>
						{/if}

						<!-- 360Dialog Fields -->
						{#if whatsappConfig.provider === '360dialog'}
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										API Key *
									</label>
									<input
										type="password"
										bind:value={whatsappConfig.api_key}
										placeholder="Leave empty to keep existing"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Client ID (Optional)
									</label>
									<input
										type="text"
										bind:value={whatsappConfig.client_id}
										placeholder="client_id"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div class="sm:col-span-2">
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Phone Number *
									</label>
									<input
										type="text"
										bind:value={whatsappConfig.phone_number}
										placeholder="+1234567890"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
							</div>
						{/if}

						<!-- Test Results -->
						{#if testSuccess && testingChannel === null}
							<div class="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
								<p class="text-sm text-green-700 dark:text-green-400">
									<i class="fas fa-check-circle mr-2"></i>{testSuccess}
								</p>
							</div>
						{/if}
						{#if testError && testingChannel === null}
							<div class="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
								<p class="text-sm text-red-700 dark:text-red-400">
									<i class="fas fa-exclamation-circle mr-2"></i>{testError}
								</p>
							</div>
						{/if}

						<!-- Action Buttons -->
						<div class="flex space-x-3">
							<button
								on:click={() => saveChannelConfig('whatsapp')}
								disabled={loading}
								class="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
							>
								{#if loading}
									<i class="fas fa-spinner fa-spin mr-2"></i>Saving...
								{:else}
									<i class="fas fa-save mr-2"></i>Save Configuration
								{/if}
							</button>
							<button
								on:click={() => testConnection('whatsapp')}
								disabled={!whatsappConfig.enabled || testingChannel !== null}
								class="rounded-lg border border-green-600 px-4 py-2 text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50 dark:hover:bg-green-900/20"
							>
								{#if testingChannel === 'whatsapp'}
									<i class="fas fa-spinner fa-spin mr-2"></i>Testing...
								{:else}
									<i class="fas fa-vial mr-2"></i>Test
								{/if}
							</button>
						</div>

						<!-- Webhook URL Info -->
						{#if whatsappConfig.enabled}
							<div
								class="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20"
							>
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-green-900 dark:text-green-100">
										<i class="fas fa-link mr-1"></i>Webhook URL
									</span>
									<button
										on:click={() => copyToClipboard(getWebhookUrl('whatsapp'))}
										class="text-sm text-green-600 hover:text-green-700 dark:text-green-400"
									>
										<i class="fas fa-copy mr-1"></i>Copy
									</button>
								</div>
								<code
									class="block overflow-x-auto rounded bg-white px-2 py-1 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200"
								>
									{getWebhookUrl('whatsapp')}
								</code>
								<p class="mt-2 text-xs text-green-700 dark:text-green-400">
									<i class="fas fa-info-circle mr-1"></i>
									Configure this webhook URL in your WhatsApp provider's dashboard
								</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Telegram Configuration -->
			{#if activeChannel === 'telegram'}
				<div
					class="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/10"
				>
					<div class="mb-4 flex items-center justify-between">
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
							<i class="fab fa-telegram mr-2 text-blue-600"></i>Telegram Configuration
						</h3>
						<label class="flex items-center space-x-2">
							<input
								type="checkbox"
								bind:checked={telegramConfig.enabled}
								class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300"
								>Enable Telegram</span
							>
						</label>
					</div>

					<div class="mb-4 rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
						<p class="text-sm text-blue-800 dark:text-blue-300">
							<i class="fas fa-info-circle mr-2"></i>
							<strong>How to get a bot token:</strong> Message
							<a href="https://t.me/BotFather" target="_blank" class="underline">@BotFather</a>
							on Telegram, send
							<code class="rounded bg-blue-200 px-1 dark:bg-blue-800">/newbot</code>, and follow the
							instructions.
						</p>
					</div>

					<div class="space-y-4">
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
								Bot Token *
							</label>
							<input
								type="password"
								bind:value={telegramConfig.bot_token}
								placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz (Leave empty to keep existing)"
								class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
							/>
						</div>

						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
								Bot Username (Optional)
							</label>
							<input
								type="text"
								bind:value={telegramConfig.bot_username}
								placeholder="@mybot"
								class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
							/>
						</div>

						<!-- Custom Webhook URL -->
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
								<i class="fas fa-link mr-1 text-blue-600"></i>
								Webhook URL (Optional - auto-generated if empty)
							</label>
							<input
								type="text"
								bind:value={customWebhookUrl}
								placeholder={getWebhookUrl('telegram')}
								class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
							/>
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Leave empty to use the default webhook URL. Edit to use a custom URL.
							</p>
						</div>

						<!-- Test Results -->
						{#if testSuccess && testingChannel === null}
							<div class="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
								<p class="text-sm text-green-700 dark:text-green-400">
									<i class="fas fa-check-circle mr-2"></i>{testSuccess}
								</p>
							</div>
						{/if}
						{#if testError && testingChannel === null}
							<div class="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
								<p class="text-sm text-red-700 dark:text-red-400">
									<i class="fas fa-exclamation-circle mr-2"></i>{testError}
								</p>
							</div>
						{/if}

						<!-- Action Buttons -->
						<div class="flex space-x-3">
							<button
								on:click={() => saveChannelConfig('telegram')}
								disabled={loading}
								class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
							>
								{#if loading}
									<i class="fas fa-spinner fa-spin mr-2"></i>Saving...
								{:else}
									<i class="fas fa-save mr-2"></i>Save Configuration
								{/if}
							</button>
							<button
								on:click={() => testConnection('telegram')}
								disabled={!telegramConfig.enabled || testingChannel !== null}
								class="rounded-lg border border-blue-600 px-4 py-2 text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-blue-900/20"
							>
								{#if testingChannel === 'telegram'}
									<i class="fas fa-spinner fa-spin mr-2"></i>Testing...
								{:else}
									<i class="fas fa-vial mr-2"></i>Test
								{/if}
							</button>
							<button
								on:click={setupTelegramWebhook}
								disabled={!telegramConfig.enabled || loading}
								class="rounded-lg border border-blue-600 px-4 py-2 text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-blue-900/20"
							>
								<i class="fas fa-link mr-2"></i>Setup Webhook
							</button>
						</div>

						<!-- Webhook URL Info -->
						{#if telegramConfig.enabled}
							<div
								class="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20"
							>
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-blue-900 dark:text-blue-100">
										<i class="fas fa-link mr-1"></i>Webhook URL
									</span>
									<button
										on:click={() => copyToClipboard(getWebhookUrl('telegram'))}
										class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
									>
										<i class="fas fa-copy mr-1"></i>Copy
									</button>
								</div>
								<code
									class="block overflow-x-auto rounded bg-white px-2 py-1 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200"
								>
									{getWebhookUrl('telegram')}
								</code>
								<p class="mt-2 text-xs text-blue-700 dark:text-blue-400">
									<i class="fas fa-info-circle mr-1"></i>
									{#if webhookUrls.telegram}
										Webhook is configured and active
									{:else}
										Click "Setup Webhook" to automatically configure this URL with Telegram
									{/if}
								</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Email Configuration -->
			{#if activeChannel === 'email'}
				<div
					class="rounded-lg border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-900/10"
				>
					<div class="mb-4 flex items-center justify-between">
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
							<i class="fas fa-envelope mr-2 text-purple-600"></i>Email Configuration
						</h3>
						<label class="flex items-center space-x-2">
							<input
								type="checkbox"
								bind:checked={emailConfig.enabled}
								class="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
							/>
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Email</span>
						</label>
					</div>

					<div class="space-y-4">
						<!-- Provider Selection -->
						<div>
							<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
								Provider *
							</label>
							<select
								bind:value={emailConfig.provider}
								class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
							>
								{#each emailProviders as provider}
									<option value={provider.value}>{provider.label}</option>
								{/each}
							</select>
						</div>

						<!-- SMTP Fields -->
						{#if emailConfig.provider === 'smtp'}
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										SMTP Host *
									</label>
									<input
										type="text"
										bind:value={emailConfig.smtp_host}
										placeholder="smtp.gmail.com"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										SMTP Port *
									</label>
									<input
										type="number"
										bind:value={emailConfig.smtp_port}
										placeholder="587"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div class="sm:col-span-2">
									<label class="flex items-center space-x-2">
										<input
											type="checkbox"
											bind:checked={emailConfig.smtp_secure}
											class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
										/>
										<span class="text-sm font-medium text-gray-700 dark:text-gray-300"
											>Use SSL/TLS</span
										>
									</label>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Username *
									</label>
									<input
										type="text"
										bind:value={emailConfig.smtp_user}
										placeholder="your_email@gmail.com"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Password *
									</label>
									<input
										type="password"
										bind:value={emailConfig.smtp_password}
										placeholder="Leave empty to keep existing"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
							</div>
						{/if}

						<!-- SendGrid Fields -->
						{#if emailConfig.provider === 'sendgrid'}
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
									SendGrid API Key *
								</label>
								<input
									type="password"
									bind:value={emailConfig.sendgrid_api_key}
									placeholder="SG.1234567890abcdef... (Leave empty to keep existing)"
									class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								/>
							</div>
						{/if}

						<!-- Mailgun Fields -->
						{#if emailConfig.provider === 'mailgun'}
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Mailgun API Key *
									</label>
									<input
										type="password"
										bind:value={emailConfig.mailgun_api_key}
										placeholder="key-1234567890abcdef... (Leave empty to keep existing)"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Domain *
									</label>
									<input
										type="text"
										bind:value={emailConfig.mailgun_domain}
										placeholder="mg.example.com"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
							</div>
						{/if}

						<!-- AWS SES Fields -->
						{#if emailConfig.provider === 'ses'}
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Region *
									</label>
									<input
										type="text"
										bind:value={emailConfig.ses_region}
										placeholder="us-east-1"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Access Key ID *
									</label>
									<input
										type="password"
										bind:value={emailConfig.ses_access_key_id}
										placeholder="AKIAIOSFODNN7EXAMPLE (Leave empty to keep existing)"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
								<div class="sm:col-span-2">
									<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
										Secret Access Key *
									</label>
									<input
										type="password"
										bind:value={emailConfig.ses_secret_access_key}
										placeholder="Leave empty to keep existing"
										class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
									/>
								</div>
							</div>
						{/if}

						<!-- Common Email Fields -->
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
									From Email *
								</label>
								<input
									type="email"
									bind:value={emailConfig.from_email}
									placeholder="bot@example.com"
									class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								/>
							</div>
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
									From Name *
								</label>
								<input
									type="text"
									bind:value={emailConfig.from_name}
									placeholder="My Support Bot"
									class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								/>
							</div>
						</div>

						<!-- Test Results -->
						{#if testSuccess && testingChannel === null}
							<div class="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
								<p class="text-sm text-green-700 dark:text-green-400">
									<i class="fas fa-check-circle mr-2"></i>{testSuccess}
								</p>
							</div>
						{/if}
						{#if testError && testingChannel === null}
							<div class="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
								<p class="text-sm text-red-700 dark:text-red-400">
									<i class="fas fa-exclamation-circle mr-2"></i>{testError}
								</p>
							</div>
						{/if}

						<!-- Action Buttons -->
						<div class="flex space-x-3">
							<button
								on:click={() => saveChannelConfig('email')}
								disabled={loading}
								class="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
							>
								{#if loading}
									<i class="fas fa-spinner fa-spin mr-2"></i>Saving...
								{:else}
									<i class="fas fa-save mr-2"></i>Save Configuration
								{/if}
							</button>
							<button
								on:click={() => testConnection('email')}
								disabled={!emailConfig.enabled || testingChannel !== null}
								class="rounded-lg border border-purple-600 px-4 py-2 text-purple-600 transition-colors hover:bg-purple-50 disabled:opacity-50 dark:hover:bg-purple-900/20"
							>
								{#if testingChannel === 'email'}
									<i class="fas fa-spinner fa-spin mr-2"></i>Testing...
								{:else}
									<i class="fas fa-vial mr-2"></i>Test
								{/if}
							</button>
						</div>

						<!-- Webhook URL Info -->
						{#if emailConfig.enabled && emailConfig.provider === 'smtp' && emailConfig.smtp_host.includes('imap')}
							<div
								class="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-900/20"
							>
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-semibold text-purple-900 dark:text-purple-100">
										<i class="fas fa-link mr-1"></i>Webhook URL (Optional)
									</span>
									<button
										on:click={() => copyToClipboard(getWebhookUrl('email'))}
										class="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
									>
										<i class="fas fa-copy mr-1"></i>Copy
									</button>
								</div>
								<code
									class="block overflow-x-auto rounded bg-white px-2 py-1 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200"
								>
									{getWebhookUrl('email')}
								</code>
								<p class="mt-2 text-xs text-purple-700 dark:text-purple-400">
									<i class="fas fa-info-circle mr-1"></i>
									Email uses IMAP polling by default. Webhook is optional for advanced setups.
								</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div
			class="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900"
		>
			<div class="flex justify-end space-x-3">
				<button
					on:click={close}
					class="rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					Close
				</button>
			</div>
		</div>
	</div>
</div>
