<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { api, type PromptUpdateDTO } from '$lib/api.js';

	import Prism from 'prismjs';
	import 'prismjs/components/prism-markup.js';
	import 'prismjs/themes/prism-tomorrow.css'; // Optional, can remove if you want only Tailwind (the preview will lose color)

	export let data;
	let isTestModalOpen = false;
	let provider;
	let variableMatches = [];
	let variableValues: { [key: string]: string } = {};
	let isTesting = false;
	let testResult: string = 'No output yet';
	let testPrice: string = '';
	let promptExecutions: Array<any> = [];
	let totalPages = 0;
	let page = 1;
	let executionHistoryCollapsed = true;
	let showCopyMenu = false;
	let copyType = '';

	let promptContent = data.prompt.content;
	let highlighted = '';
	$: highlighted = Prism.highlight(promptContent, Prism.languages.markup, 'markup');
	$: if (formData.content) variableMatches = formData.content.match(/{{\s*[\w]+\s*}}/g) || [];
	$: {
		for (const match of variableMatches) {
			const variableName = match.replace(/{{\s*|\s*}}/g, '');
			if (!variableValues[variableName]) {
				variableValues[variableName] = '';
			}
		}
	}
	let formData: PromptUpdateDTO = {
		content: data.prompt.content,
		api_key: data.prompt.api_key,
		llm_settings: {
			model: data.prompt.llm_settings?.model,
			parameters: {
				temperature: data.prompt.llm_settings?.parameters?.temperature,
				max_tokens: data.prompt.llm_settings?.parameters?.max_tokens,
				top_p: data.prompt.llm_settings?.parameters?.top_p,
				frequency_penalty: data.prompt.llm_settings?.parameters?.frequency_penalty,
				presence_penalty: data.prompt.llm_settings?.parameters?.presence_penalty
			}
		}
	};
	$: formData.content = promptContent;
	$: if (typeof formData.api_key === 'string') {
		provider = data.project.apiKeys.find((api_key) => api_key._id == formData.api_key)?.provider;
	}
	async function updatePrompt() {
		const response = await api.updatePrompt(
			data.organization_id,
			data.project._id,
			data.prompt._id,
			formData
		);
		if (response) invalidateAll();
	}
	async function testPrompt() {
		isTesting = true;
		testResult = 'No output yet';
		testPrice = '';

		const response = await api.testPrompt({
			content: promptContent || '',
			llm_settings: formData.llm_settings,
			api_key_id: formData.api_key,
			variables: variableValues
		});
		if (response) {
			testResult = response.result;
			testPrice = response.usage.cost;
		} else {
			testResult = 'Error executing prompt';
		}
		isTesting = false;
	}
	async function getPromptExecutions() {
		const response = await api.getPromptExecutions(
			data.organization_id,
			data.project._id,
			data.prompt._id,
			page
		);
		if (response) {
			promptExecutions = response.executions;
			totalPages = Math.round(response.total / response.limit);
		}
	}
	onMount(() => {
		getPromptExecutions();
	});

	function copyAs(type: string) {
		copyType = type;
		showCopyMenu = true;
		setTimeout(() => (showCopyMenu = false), 1700);
		navigator.clipboard.writeText(`// TODO: Generate ${type} payload`);
	}
</script>

<section class="mx-auto w-full px-2 py-10 sm:px-4">
	<!-- Top Bar -->
	<div class="mb-8 flex flex-col items-start justify-between sm:flex-row sm:items-center">
		<h1 class="mb-4 text-3xl font-bold text-white sm:mb-0">
			Edit Prompt: <span class="text-sky-300">{data.prompt.name}</span>
		</h1>
		<a
			href="/app/org/{data.organization_id}/project/{data.project._id}"
			class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
			>Back to Prompts</a
		>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Prompt Editor -->
		<div
			class="flex flex-col gap-6 rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg lg:col-span-2"
		>
			<div
				class="mb-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<h3 class="text-xl font-semibold text-white">Prompt Editor</h3>
				<div class="flex gap-2">
					<button
						class="rounded border border-sky-800 bg-gray-800 px-3 py-1 text-xs text-sky-300 hover:bg-sky-900"
						on:click={() => copyAs('cURL')}>Copy as cURL</button
					>
					<button
						class="rounded border border-green-800 bg-gray-800 px-3 py-1 text-xs text-green-300 hover:bg-green-900"
						on:click={() => copyAs('JSON')}>Copy as JSON</button
					>
					<button
						class="rounded border border-purple-800 bg-gray-800 px-3 py-1 text-xs text-purple-300 hover:bg-purple-900"
						on:click={() => copyAs('Code')}>Copy as Code</button
					>
				</div>
			</div>
			<div>
				<label class="mb-1 block text-sm text-gray-400" for="prompt-text">Prompt template</label>
				<textarea
					id="prompt-text"
					class="mb-2 w-full rounded-lg border border-gray-700 bg-gray-800 p-3 font-mono text-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
					rows="7"
					bind:value={promptContent}
					spellcheck="false"
				></textarea>
				<label class="text-xs text-gray-400">Preview with syntax highlighting:</label>
				<pre
					class="mt-1 overflow-x-auto rounded border border-gray-800 bg-[#232531] p-3 font-mono text-xs"
					tabindex="0"><code class="language-markup">{@html highlighted}</code></pre>
			</div>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label class="mb-2 block text-gray-300">Default API Key</label>
					<select
						bind:value={formData.api_key}
						class="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
					>
						<option value="">Select key...</option>
						{#each data.project.apiKeys as api_key}
							<option value={api_key._id}>{api_key.name}</option>
						{/each}
					</select>
				</div>
				{#if provider}
					<div>
						<label class="mb-2 block text-gray-300">Default Model</label>
						<select
							name="model"
							bind:value={formData.llm_settings.model}
							class="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
						>
							<option value="">Select model...</option>
							{#each provider.models as model}
								<option value={model}>{model}</option>
							{/each}
						</select>
					</div>
				{/if}
			</div>
		</div>

		<!-- LLM Settings -->
		<div class="flex flex-col rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-lg">
			<h3 class="mb-4 text-xl font-semibold text-white">LLM Settings</h3>
			{#each [{ label: 'Temperature', key: 'temperature', min: 0, max: 1, step: 0.1, placeholder: '0.7' }, { label: 'Max Tokens', key: 'max_tokens', min: 1, max: undefined, step: 1, placeholder: '100' }, { label: 'Top P', key: 'top_p', min: 0, max: 1, step: 0.01, placeholder: '1.0' }, { label: 'Frequency Penalty', key: 'frequency_penalty', min: 0, max: 2, step: 0.01, placeholder: '0.0' }, { label: 'Presence Penalty', key: 'presence_penalty', min: 0, max: 2, step: 0.01, placeholder: '0.0' }] as item}
				<div class="mb-4">
					<label class="mb-2 block text-gray-300">{item.label}</label>
					<input
						type="number"
						class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
						placeholder={item.placeholder}
						min={item.min}
						max={item.max}
						step={item.step}
						bind:value={formData.llm_settings.parameters[item.key]}
					/>
				</div>
			{/each}
			<button
				on:click={() => (isTestModalOpen = true)}
				class="mt-4 w-full rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
				>Test Prompt</button
			>
		</div>
	</div>

	<!-- Collapsible Execution History -->
	{#if promptExecutions.length > 0}
		<div class="mt-6">
			<div
				class="mb-2 flex cursor-pointer select-none items-center gap-3"
				on:click={() => (executionHistoryCollapsed = !executionHistoryCollapsed)}
			>
				<span class="text-lg font-semibold text-white">Execution History</span>
				<span class="rounded bg-gray-800 px-2 text-xs text-gray-200">
					{promptExecutions.length} results
				</span>
				<svg
					class="h-5 w-5 text-gray-400 transition"
					style="transform: rotate({executionHistoryCollapsed ? 180 : 0}deg)"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
				</svg>
				<span class="text-xs text-gray-400">{executionHistoryCollapsed ? '(show)' : '(hide)'}</span>
			</div>
			<div class={executionHistoryCollapsed ? 'hidden' : ''}>
				<div class="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900 p-2 shadow-lg">
					<table class="w-full border-collapse text-left text-sm">
						<thead>
							<tr>
								<th class="border-b border-gray-800 p-3 font-semibold text-gray-200">Status</th>
								<th class="border-b border-gray-800 p-3 font-semibold text-gray-200">Date/Time</th>
								<th class="border-b border-gray-800 p-3 font-semibold text-gray-200"
									>Finish Reason</th
								>
								<th class="border-b border-gray-800 p-3 font-semibold text-gray-200">Price</th>
								<th class="border-b border-gray-800 p-3 font-semibold text-gray-200">Model</th>
							</tr>
						</thead>
						<tbody>
							{#each promptExecutions as execution}
								<tr>
									<td
										class="border-b border-gray-800 p-3
                                    {execution.status === 'success' ? 'text-green-500' : ''}
                                    {execution.status === 'error' ? 'text-red-500' : ''}
                                    {execution.status === 'cached' ? 'text-gray-300' : ''}"
										>{execution.status}</td
									>
									<td class="border-b border-gray-800 p-3 text-gray-200"
										>{new Date(execution.createdAt).toLocaleString()}</td
									>
									<td class="border-b border-gray-800 p-3 text-gray-200"
										>{execution.metadata.finish_reason}</td
									>
									<td class="border-b border-gray-800 p-3 text-gray-200"
										>{execution.usage.cost} $</td
									>
									<td class="border-b border-gray-800 p-3 text-gray-200"
										>{execution.metadata.model}</td
									>
								</tr>
							{/each}
						</tbody>
					</table>
					<!-- Pagination -->
					<div class="mt-4 flex items-center justify-between">
						<div>
							{#if page > 1}
								<button
									on:click={() => {
										page -= 1;
										getPromptExecutions();
									}}
									class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600"
									>Previous</button
								>
							{/if}
						</div>
						<span class="text-gray-300">Page {page} of {totalPages}</span>
						<div>
							{#if page < totalPages}
								<button
									on:click={() => {
										page += 1;
										getPromptExecutions();
									}}
									class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600"
									>Next</button
								>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Floating Save Button -->
	<button
		on:click={updatePrompt}
		class="fixed bottom-10 right-10 z-40 flex items-center gap-2 rounded-full border-4 border-emerald-700 bg-emerald-600 px-7 py-3 text-lg font-bold text-white shadow-lg ring-2 ring-emerald-400 ring-offset-2 transition hover:bg-emerald-700 focus:outline-none"
		title="Save Prompt"
	>
		<svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
		</svg>
		<span>Save</span>
	</button>

	<!-- Copy as Modal/Toast -->
	{#if showCopyMenu}
		<div
			class="fixed bottom-28 right-10 z-50 animate-bounce rounded-xl border border-gray-700 bg-gray-800 px-5 py-2 text-white shadow-xl"
		>
			Copied <span class="font-semibold">{copyType}</span> placeholder to clipboard!
		</div>
	{/if}
</section>

<!-- Test Prompt Modal -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 text-white"
	class:hidden={!isTestModalOpen}
>
	<div class="w-full max-w-2xl rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
		<h2 class="mb-4 text-xl font-bold">Test Prompt</h2>
		<div id="variables-section" class="mb-4">
			<h3 class="mb-2 text-lg font-semibold text-gray-100">Input Variables</h3>
			{#each variableMatches as variable}
				<div class="mb-2">
					<label class="mb-1 block text-gray-300">{variable}</label>
					<input
						type="text"
						id="variable-{variable}"
						class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
						placeholder="Enter value for {variable}"
						bind:value={variableValues[variable.replace(/{{\s*|\s*}}/g, '')]}
					/>
				</div>
			{/each}
		</div>
		<button
			class="flex w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
			class:disabled={isTesting}
			on:click={testPrompt}
		>
			{#if isTesting}
				<svg
					class="mr-2 h-6 w-6 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
				</svg>
				Testing...
			{:else}
				Run Test
			{/if}
		</button>
		<div class="mt-6 rounded-lg border border-gray-700 bg-gray-800 p-4">
			<h3 class="mb-2 text-lg font-semibold">Output</h3>
			<p class="break-words text-gray-300" id="output-text">{testResult}</p>
		</div>
		{#if testPrice != ''}
			<div class="mt-6 flex justify-between rounded-lg border border-gray-700 bg-gray-800 p-2">
				<h3 class="mb-2 text-lg font-semibold">Price</h3>
				<p class="text-gray-300" id="output-text">{testPrice} $</p>
			</div>
		{/if}
		<button
			on:click={() => (isTestModalOpen = false)}
			class="mt-4 w-full rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600"
			>Close</button
		>
	</div>
</div>
