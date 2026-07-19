<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { api } from '$lib/api';

	export let data;
	export let agent;
	const dispatch = createEventDispatcher();

	let loading = false;
	let error = '';
	let success = '';

	// Voice configuration state
	let provider: 'openai' | 'elevenlabs' = 'openai';
	let elevenLabsApiKey = '';
	let voiceId = '';
	let model = '';

	// Current saved state
	let hasElevenLabsApiKey = false;
	let fetchingConfig = true;

	// ElevenLabs default models
	const elevenLabsModels = [
		{ id: 'eleven_turbo_v2_5', name: 'Eleven Turbo v2.5 (Fastest)' },
		{ id: 'eleven_turbo_v2', name: 'Eleven Turbo v2' },
		{ id: 'eleven_multilingual_v2', name: 'Eleven Multilingual v2' },
		{ id: 'eleven_monolingual_v1', name: 'Eleven Monolingual v1' }
	];

	// OpenAI TTS models
	const openaiModels = [
		{ id: 'tts-1', name: 'TTS-1 (Faster)' },
		{ id: 'tts-1-hd', name: 'TTS-1 HD (Higher Quality)' }
	];

	// OpenAI voices
	const openaiVoices = [
		{ id: 'alloy', name: 'Alloy' },
		{ id: 'echo', name: 'Echo' },
		{ id: 'fable', name: 'Fable' },
		{ id: 'onyx', name: 'Onyx' },
		{ id: 'nova', name: 'Nova' },
		{ id: 'shimmer', name: 'Shimmer' }
	];

	$: currentModels = provider === 'elevenlabs' ? elevenLabsModels : openaiModels;

	async function fetchConfig() {
		fetchingConfig = true;
		error = '';
		try {
			const res = await api.fetch(
				`/organizations/${data.organization_id}/projects/${data.project._id}/agents/${agent._id}/voice-config`
			);
			if (res.ok) {
				const result = await res.json();
				if (result.success && result.data) {
					provider = result.data.provider || 'openai';
					voiceId = result.data.voice_id || '';
					model = result.data.model || '';
					hasElevenLabsApiKey = result.data.has_elevenlabs_api_key || false;
				}
			}
		} catch (err) {
			console.error('Failed to fetch voice config:', err);
		} finally {
			fetchingConfig = false;
		}
	}

	fetchConfig();

	async function saveConfiguration() {
		loading = true;
		error = '';
		success = '';

		try {
			if (provider === 'elevenlabs' && !hasElevenLabsApiKey && !elevenLabsApiKey.trim()) {
				throw new Error('ElevenLabs API key is required when using ElevenLabs as provider');
			}

			const payload: Record<string, string> = { provider };
			if (voiceId.trim()) payload.voice_id = voiceId.trim();
			if (model.trim()) payload.model = model.trim();
			if (provider === 'elevenlabs' && elevenLabsApiKey.trim()) {
				payload.api_key = elevenLabsApiKey.trim();
			}

			const res = await api.fetch(
				`/organizations/${data.organization_id}/projects/${data.project._id}/agents/${agent._id}/voice-config`,
				{
					method: 'POST',
					body: JSON.stringify(payload)
				}
			);

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || 'Failed to save voice configuration');
			}

			const result = await res.json();
			success = result.message || 'Voice configuration saved successfully!';
			hasElevenLabsApiKey = result.has_api_key || false;
			elevenLabsApiKey = '';

			dispatch('configured', result);
		} catch (err: any) {
			error = err.message || 'Something went wrong';
		} finally {
			loading = false;
		}
	}
</script>

<!-- Backdrop -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
	<div
		class="mx-auto w-full max-w-lg transform overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-900 shadow-2xl"
	>
		<!-- Header -->
		<div class="border-b border-gray-700/50 p-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-orange-600 to-red-700"
					>
						<i class="fas fa-microphone text-white"></i>
					</div>
					<div>
						<h2 class="text-lg font-bold text-gray-100">Voice Configuration</h2>
						<p class="text-sm text-gray-400">Configure audio narration for slide generation</p>
					</div>
				</div>
				<button
					on:click={() => dispatch('close')}
					class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
				>
					<i class="fas fa-times"></i>
				</button>
			</div>
		</div>

		<!-- Body -->
		<div class="space-y-6 p-6">
			{#if fetchingConfig}
				<div class="flex items-center justify-center py-8">
					<i class="fas fa-spinner animate-spin text-2xl text-orange-500"></i>
				</div>
			{:else}
				<!-- Error / Success banners -->
				{#if error}
					<div class="flex items-center space-x-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
						<i class="fas fa-exclamation-circle flex-shrink-0"></i>
						<span>{error}</span>
					</div>
				{/if}
				{#if success}
					<div class="flex items-center space-x-2 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
						<i class="fas fa-check-circle flex-shrink-0"></i>
						<span>{success}</span>
					</div>
				{/if}

				<!-- Provider Selection -->
				<div class="space-y-3">
					<label class="block text-sm font-medium text-gray-300">
						Audio Provider <span class="text-gray-500">(optional)</span>
					</label>
					<div class="grid grid-cols-2 gap-3">
						<button
							type="button"
							on:click={() => { provider = 'openai'; elevenLabsApiKey = ''; }}
							class="flex items-center space-x-3 rounded-lg border-2 p-4 text-left transition-all {provider === 'openai'
								? 'border-green-500 bg-green-500/10'
								: 'border-gray-700 hover:border-gray-600'}"
						>
							<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-teal-600">
								<i class="fas fa-robot text-sm text-white"></i>
							</div>
							<div>
								<p class="font-medium text-gray-100 text-sm">OpenAI</p>
								<p class="text-xs text-gray-400">Uses agent's LLM key</p>
							</div>
							{#if provider === 'openai'}
								<i class="fas fa-check-circle ml-auto text-green-500"></i>
							{/if}
						</button>

						<button
							type="button"
							on:click={() => (provider = 'elevenlabs')}
							class="flex items-center space-x-3 rounded-lg border-2 p-4 text-left transition-all {provider === 'elevenlabs'
								? 'border-orange-500 bg-orange-500/10'
								: 'border-gray-700 hover:border-gray-600'}"
						>
							<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-amber-600">
								<i class="fas fa-wave-square text-sm text-white"></i>
							</div>
							<div>
								<p class="font-medium text-gray-100 text-sm">ElevenLabs</p>
								<p class="text-xs text-gray-400">Premium voice AI</p>
							</div>
							{#if provider === 'elevenlabs'}
								<i class="fas fa-check-circle ml-auto text-orange-500"></i>
							{/if}
						</button>
					</div>
				</div>

				<!-- ElevenLabs API Key (only when elevenlabs is selected) -->
				{#if provider === 'elevenlabs'}
					<div class="space-y-2">
						<label class="block text-sm font-medium text-gray-300" for="elevenlabs-api-key">
							ElevenLabs API Key
							{#if hasElevenLabsApiKey}
								<span class="ml-2 inline-flex items-center rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
									<i class="fas fa-lock mr-1 text-xs"></i> Saved
								</span>
							{/if}
						</label>
						<input
							id="elevenlabs-api-key"
							type="password"
							bind:value={elevenLabsApiKey}
							placeholder={hasElevenLabsApiKey ? '••••••••••••••••••••••••••• (leave blank to keep existing)' : 'sk_...'}
							disabled={loading}
							class="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
						/>
						<p class="text-xs text-gray-500">
							Your key is encrypted with AES before storage and is never exposed.
						</p>
					</div>
				{/if}

				<!-- Voice ID -->
				<div class="space-y-2">
					<label class="block text-sm font-medium text-gray-300" for="voice-id">
						Voice ID
						{#if provider === 'openai'}
							<span class="text-gray-500">— or select below</span>
						{:else}
							<span class="text-gray-500 text-xs">(ElevenLabs voice ID)</span>
						{/if}
					</label>
					{#if provider === 'openai'}
						<div class="grid grid-cols-3 gap-2">
							{#each openaiVoices as v}
								<button
									type="button"
									on:click={() => (voiceId = v.id)}
									class="rounded-lg border px-3 py-2 text-sm transition-all {voiceId === v.id
										? 'border-green-500 bg-green-500/10 text-green-300'
										: 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'}"
								>
									{v.name}
								</button>
							{/each}
						</div>
					{:else}
						<input
							id="voice-id"
							type="text"
							bind:value={voiceId}
							placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
							disabled={loading}
							class="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
						/>
						<p class="text-xs text-gray-500">
							Find voice IDs in your
							<a href="https://elevenlabs.io/app/voice-library" target="_blank" rel="noopener noreferrer" class="text-orange-400 hover:underline">ElevenLabs voice library</a>.
						</p>
					{/if}
				</div>

				<!-- Model -->
				<div class="space-y-2">
					<label class="block text-sm font-medium text-gray-300" for="voice-model">Model</label>
					<select
						id="voice-model"
						bind:value={model}
						disabled={loading}
						class="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-gray-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
					>
						<option value="">Default model</option>
						{#each currentModels as m}
							<option value={m.id}>{m.name}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-end space-x-3 border-t border-gray-700/50 px-6 py-4">
			<button
				type="button"
				on:click={() => dispatch('close')}
				disabled={loading}
				class="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-300 transition-all hover:bg-gray-700 focus:outline-none disabled:opacity-50"
			>
				Cancel
			</button>
			<button
				type="button"
				on:click={saveConfiguration}
				disabled={loading || fetchingConfig}
				class="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-700 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:from-orange-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-orange-500/40 disabled:opacity-50"
			>
				{#if loading}
					<i class="fas fa-spinner animate-spin"></i>
					<span>Saving...</span>
				{:else}
					<i class="fas fa-save"></i>
					<span>Save Configuration</span>
				{/if}
			</button>
		</div>
	</div>
</div>
