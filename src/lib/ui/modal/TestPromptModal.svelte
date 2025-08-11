<script lang="ts">
	import { api } from '$lib/api.js';
	import type { TestPromptParameters } from '$lib/api.js';
	import { createEventDispatcher } from 'svelte';

	export let isOpen = false;
	export let variableMatches: string[] = [];
	export let promptContent: string = '';
	export let apiKey: string = '';
	export let provider: any = null;
	export let selectedModels: string[] = [];

	const dispatch = createEventDispatcher();

	let variableValues: { [key: string]: string } = {};
	let isTesting = false;
	let testResults: { [model: string]: { result: string; price: string; error?: string } } = {};
	let llmSettings = {
		parameters: {
			temperature: 0.7,
			max_tokens: 100,
			top_p: 1.0,
			frequency_penalty: 0.0,
			presence_penalty: 0.0
		}
	};

	// Initialize variable values when matches change
	$: {
		for (const match of variableMatches) {
			const variableName = match.replace(/{{\s*|\s*}}/g, '');
			if (!variableValues[variableName]) {
				variableValues[variableName] = '';
			}
		}
	}

	// Initialize selected models with the first model if none selected
	$: if (provider && provider.models && selectedModels.length === 0) {
		selectedModels = [provider.models[0]];
	}

	function toggleModel(model: string) {
		if (selectedModels.includes(model)) {
			selectedModels = selectedModels.filter((m) => m !== model);
		} else {
			selectedModels = [...selectedModels, model];
		}
	}

	async function testPrompt() {
		if (selectedModels.length === 0) {
			alert('Please select at least one model to test');
			return;
		}

		isTesting = true;
		testResults = {};

		// Test each selected model
		for (const model of selectedModels) {
			testResults[model] = { result: 'Testing...', price: '' };

			try {
				const parameters: TestPromptParameters = {
					content: promptContent,
					llm_settings: {
						model: model,
						parameters: llmSettings.parameters
					},
					api_key_id: apiKey,
					variables: variableValues
				};

				const response = await api.testPrompt(parameters);

				if (response) {
					testResults[model] = {
						result: (response as any).result,
						price: (response as any).usage?.cost || 'N/A'
					};
				} else {
					testResults[model] = {
						result: 'Error executing prompt',
						price: 'N/A',
						error: 'Unknown error'
					};
				}
			} catch (error) {
				testResults[model] = {
					result: 'Error executing prompt',
					price: 'N/A',
					error: error instanceof Error ? error.message : 'Unknown error'
				};
			}
		}

		isTesting = false;
	}

	function closeModal() {
		isOpen = false;
		dispatch('close');
	}

	function resetTests() {
		testResults = {};
	}

	function selectAllModels() {
		if (provider && provider.models) {
			selectedModels = [...provider.models];
		}
	}

	function clearAllModels() {
		selectedModels = [];
	}
</script>

<!-- Test Prompt Modal -->
{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 text-white">
		<div
			class="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-2xl font-bold">Test Prompt with Multiple Models</h2>
				<button
					on:click={closeModal}
					class="rounded-lg bg-gray-700 px-3 py-1 text-gray-300 hover:bg-gray-600"
				>
					✕
				</button>
			</div>

			<!-- Variables Section -->
			{#if variableMatches.length > 0}
				<div class="mb-6">
					<h3 class="mb-3 text-lg font-semibold text-gray-100">Input Variables</h3>
					<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
						{#each variableMatches as variable, index}
							{@const variableId = `variable-${index}`}
							<div>
								<label class="mb-1 block text-gray-300" for={variableId}>{variable}</label>
								<input
									type="text"
									id={variableId}
									class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
									placeholder="Enter value for {variable}"
									bind:value={variableValues[variable.replace(/{{\s*|\s*}}/g, '')]}
								/>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Model Selection -->
			{#if provider && provider.models}
				<div class="mb-6">
					<div class="mb-3 flex items-center gap-3">
						<h3 class="text-lg font-semibold text-gray-100">Select Models to Test</h3>
						{#if provider.name?.toLowerCase().includes('openai')}
							<div class="flex h-6 w-6 items-center justify-center rounded bg-white p-1">
								<svg viewBox="0 0 24 24" class="h-4 w-4">
									<path
										fill="#10a37f"
										d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
									/>
								</svg>
							</div>
						{/if}
					</div>

					<!-- Selected Models Display -->
					<div class="mb-4 min-h-[2.5rem] rounded-lg border border-gray-700 bg-gray-800 p-3">
						{#if selectedModels.length === 0}
							<span class="text-sm text-gray-500">No models selected</span>
						{:else}
							<div class="flex flex-wrap gap-2">
								{#each selectedModels as selectedModel}
									<span
										class="inline-flex items-center gap-1 rounded-full bg-sky-600 px-3 py-1 text-sm text-white"
									>
										{selectedModel}
										<button
											on:click={() => toggleModel(selectedModel)}
											class="ml-1 rounded-full hover:bg-sky-700"
											aria-label="Remove {selectedModel}"
										>
											<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
												<path
													fill-rule="evenodd"
													d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
													clip-rule="evenodd"
												/>
											</svg>
										</button>
									</span>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Available Models -->
					<div class="mb-3 flex items-center justify-between">
						<span class="text-sm font-medium text-gray-300">Available Models:</span>
						<div class="flex gap-2">
							<button
								on:click={selectAllModels}
								class="rounded border border-sky-400/30 px-2 py-1 text-xs text-sky-400 transition-colors hover:border-sky-300/50 hover:text-sky-300"
								disabled={selectedModels.length === provider.models.length}
							>
								Select All
							</button>
							<button
								on:click={clearAllModels}
								class="rounded border border-gray-400/30 px-2 py-1 text-xs text-gray-400 transition-colors hover:border-gray-300/50 hover:text-gray-300"
								disabled={selectedModels.length === 0}
							>
								Clear All
							</button>
						</div>
					</div>
					<div class="max-h-48 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800">
						{#each provider.models as model}
							<button
								on:click={() => toggleModel(model)}
								class="flex w-full items-center justify-between border-b border-gray-700 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-700 {selectedModels.includes(
									model
								)
									? 'bg-sky-900/30 text-sky-200'
									: 'text-gray-300'}"
							>
								<span class="text-sm font-medium">{model}</span>
								{#if selectedModels.includes(model)}
									<svg class="h-4 w-4 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								{:else}
									<svg
										class="h-4 w-4 text-gray-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 6v6m0 0v6m0-6h6m-6 0H6"
										/>
									</svg>
								{/if}
							</button>
						{/each}
					</div>

					<div class="mt-3 flex items-center justify-between">
						<p class="text-sm text-gray-400">
							{selectedModels.length} of {provider.models.length} model{selectedModels.length !== 1
								? 's'
								: ''} selected
						</p>
					</div>
				</div>
			{/if}

			<!-- LLM Parameters -->
			<div class="mb-6">
				<h3 class="mb-3 text-lg font-semibold text-gray-100">LLM Parameters</h3>
				<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
					<div>
						<label class="mb-1 block text-sm text-gray-300" for="temperature">Temperature</label>
						<input
							type="number"
							id="temperature"
							min="0"
							max="1"
							step="0.1"
							bind:value={llmSettings.parameters.temperature}
							class="w-full rounded border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm text-gray-300" for="max-tokens">Max Tokens</label>
						<input
							type="number"
							id="max-tokens"
							min="1"
							bind:value={llmSettings.parameters.max_tokens}
							class="w-full rounded border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm text-gray-300" for="top-p">Top P</label>
						<input
							type="number"
							id="top-p"
							min="0"
							max="1"
							step="0.01"
							bind:value={llmSettings.parameters.top_p}
							class="w-full rounded border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm text-gray-300" for="frequency-penalty"
							>Frequency Penalty</label
						>
						<input
							type="number"
							id="frequency-penalty"
							min="0"
							max="2"
							step="0.01"
							bind:value={llmSettings.parameters.frequency_penalty}
							class="w-full rounded border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm text-gray-300" for="presence-penalty"
							>Presence Penalty</label
						>
						<input
							type="number"
							id="presence-penalty"
							min="0"
							max="2"
							step="0.01"
							bind:value={llmSettings.parameters.presence_penalty}
							class="w-full rounded border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
						/>
					</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="mb-6 flex gap-3">
				<button
					class="flex items-center justify-center rounded-lg bg-sky-600 px-6 py-2 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50"
					disabled={isTesting || selectedModels.length === 0}
					on:click={testPrompt}
				>
					{#if isTesting}
						<svg
							class="mr-2 h-5 w-5 animate-spin"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
							></path>
						</svg>
						Testing...
					{:else}
						Run Tests
					{/if}
				</button>

				{#if Object.keys(testResults).length > 0}
					<button
						on:click={resetTests}
						class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600"
					>
						Clear Results
					</button>
				{/if}
			</div>

			<!-- Test Results -->
			{#if Object.keys(testResults).length > 0}
				<div class="space-y-4">
					<div class="flex items-center gap-3">
						<h3 class="text-lg font-semibold text-gray-100">Test Results</h3>
						{#if provider.name?.toLowerCase().includes('openai')}
							<div class="flex h-5 w-5 items-center justify-center rounded bg-white p-0.5">
								<svg viewBox="0 0 24 24" class="h-3 w-3">
									<path
										fill="#10a37f"
										d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
									/>
								</svg>
							</div>
						{/if}
					</div>
					{#each Object.entries(testResults) as [model, result]}
						<div class="rounded-lg border border-gray-700 bg-gray-800 p-4">
							<div class="mb-2 flex items-center justify-between">
								<h4 class="font-semibold text-white">{model}</h4>
								<div class="flex items-center gap-2">
									{#if result.price && result.price !== 'N/A'}
										<span class="rounded bg-green-600 px-2 py-1 text-xs text-white">
											${result.price}
										</span>
									{/if}
									{#if result.error}
										<span class="rounded bg-red-600 px-2 py-1 text-xs text-white"> Error </span>
									{:else}
										<span class="rounded bg-green-600 px-2 py-1 text-xs text-white"> Success </span>
									{/if}
								</div>
							</div>
							<div class="rounded border border-gray-600 bg-gray-900 p-3">
								<pre
									class="whitespace-pre-wrap break-words text-sm text-gray-300">{result.result}</pre>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Close Button -->
			<div class="mt-6 flex justify-end">
				<button
					on:click={closeModal}
					class="rounded-lg bg-gray-700 px-6 py-2 text-gray-300 hover:bg-gray-600"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
