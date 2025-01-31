<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api, type PromptUpdateDTO } from '$lib/api.js';

	export let data;
	let isTestModalOpen = false;
	let provider;
	let variableMatches = [];
	let variableValues: { [key: string]: string } = {};
	let isTesting: boolean = false;
	let testResult: string = 'No output yet';
	let testPrice: string = '';
	let promptExecutions: Array<any> = [];
	let totalPages: number = 0;
	let page: number = 1;

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
		console.log(response);
		if (response) {
			invalidateAll();
		}
	}

	async function testPrompt() {
		isTesting = true;
		testResult = 'No output yet';
		testPrice = '';
		const response = await api.executePrompt(
			data.organization_id,
			data.project._id,
			data.prompt.name,
			{ variables: variableValues }
		);
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

	getPromptExecutions();
</script>

<div id="prompt-details">
	<div class="mb-8 flex items-center justify-between">
		<h1 id="prompt-name" class="text-2xl font-semibold text-gray-100">
			Prompt : {data.prompt.name}
		</h1>
		<div>
			<button
				on:click={updatePrompt}
				class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>Save</button
			>
			<a
				href="/app/org/{data.organization_id}/project/{data.project._id}"
				class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>Back to Prompts</a
			>
		</div>
	</div>
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Prompt Editor -->
		<div class="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg lg:col-span-2">
			<h3 class="mb-4 text-xl font-semibold text-gray-100">Prompt Editor</h3>
			<textarea
				id="prompt-text"
				class="w-full rounded-lg border border-gray-700 bg-gray-800 p-4 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
				rows="6"
				bind:value={formData.content}
				placeholder="Enter your prompt here..."
			></textarea>
			<div class="mt-4">
				<label class="mb-2 block text-gray-300">Default API Key</label>
				<select
					bind:value={formData.api_key}
					class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option></option>
					{#each data.project.apiKeys as api_key}
						<option value={api_key._id}>{api_key.name}</option>
					{/each}
				</select>
			</div>
			{#if provider}
				<div class="mt-4">
					<label class="mb-2 block text-gray-300">Default Model</label>
					<select
						name="model"
						bind:value={formData.llm_settings.model}
						class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option></option>
						{#each provider.models as model}
							<option value={model}>{model}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>

		<!-- LLM Settings -->
		<div class="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
			<h3 class="mb-4 text-xl font-semibold text-gray-100">LLM Settings</h3>
			<div class="mb-4">
				<label class="mb-2 block text-gray-300">Temperature</label>
				<input
					type="number"
					id="temperature"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="0.7"
					min="0"
					max="1"
					step="0.1"
					bind:value={formData.llm_settings.parameters.temperature}
				/>
			</div>
			<div class="mb-4">
				<label class="mb-2 block text-gray-300">Max Tokens</label>
				<input
					type="number"
					id="max-tokens"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="100"
					min="1"
					bind:value={formData.llm_settings.parameters.max_tokens}
				/>
			</div>
			<div class="mb-4">
				<label class="mb-2 block text-gray-300">Top P</label>
				<input
					type="number"
					id="top-p"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="1.0"
					min="0"
					max="1"
					step="0.01"
					bind:value={formData.llm_settings.parameters.top_p}
				/>
			</div>
			<div class="mb-4">
				<label class="mb-2 block text-gray-300">Frequency Penalty</label>
				<input
					type="number"
					id="frequency-penalty"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="0.0"
					min="0"
					max="2"
					step="0.01"
					bind:value={formData.llm_settings.parameters.frequency_penalty}
				/>
			</div>
			<div class="mb-4">
				<label class="mb-2 block text-gray-300">Presence Penalty</label>
				<input
					type="number"
					id="presence-penalty"
					class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="0.0"
					min="0"
					max="2"
					step="0.01"
					bind:value={formData.llm_settings.parameters.presence_penalty}
				/>
			</div>
			<button
				on:click={() => (isTestModalOpen = true)}
				class="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>Test Prompt</button
			>
		</div>
	</div>

	{#if promptExecutions.length > 0}
		<div class="mt-4 rounded-lg border border-gray-800 bg-gray-900 p-6 text-white shadow-lg">
			<h2 class="mb-4 text-lg font-semibold">Execution History</h2>
			<table class="w-full border-collapse text-left">
				<thead>
					<tr>
						<th class="border-b border-gray-800 p-3">Status</th>
						<th class="border-b border-gray-800 p-3">Date/Time</th>
						<th class="border-b border-gray-800 p-3">Finish Reason</th>
						<th class="border-b border-gray-800 p-3">Price</th>
						<th class="border-b border-gray-800 p-3">Model</th>
					</tr>
				</thead>
				<tbody id="history-list">
					{#each promptExecutions as execution}
						<tr>
							<td
								class:text-green-500={execution.status === 'success'}
								class:text-red-500={execution.status === 'error'}
								class:text-gray-300={execution.status === 'cached'}
								class="border-b border-gray-800 p-3">{execution.status}</td
							>
							<td class="border-b border-gray-800 p-3">{execution.createdAt}</td>
							<td class="border-b border-gray-800 p-3">{execution.metadata.finish_reason}</td>
							<td class="border-b border-gray-800 p-3">{execution.usage.cost} $</td>
							<td class="border-b border-gray-800 p-3">{execution.metadata.model}</td>
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
							class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
							>Previous</button
						>
					{/if}
				</div>
				<span id="pagination-info" class="text-gray-300">Page {page} of {totalPages}</span>
				<div>
					{#if page < totalPages}
						<button
							on:click={() => {
								page += 1;
								getPromptExecutions();
							}}
							class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
							>Next</button
						>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<div
	id="test-modal"
	class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white"
	class:hidden={!isTestModalOpen}
>
	<div class="w-full max-w-2xl rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
		<h2 class="mb-4 text-xl font-semibold">Test Prompt</h2>
		<!-- <div class="mb-4">
			<label class="mb-2 block text-gray-300">Select Model</label>
			<select
				id="test-model"
				class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<option>GPT-4</option>
				<option>GPT-3.5</option>
				<option>Custom LLM</option>
			</select>
		</div> -->
		<div id="variables-section" class="mb-4">
			<h3 class="mb-2 text-lg font-semibold text-gray-100">Input Variables</h3>
			{#each variableMatches as variable}
				<div class="mb-2">
					<label class="mb-1 block text-gray-300">{variable}</label>
					<input
						type="text"
						id="variable-{variable}"
						class="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Enter value for {variable}"
						bind:value={variableValues[variable.replace(/{{\s*|\s*}}/g, '')]}
					/>
				</div>
			{/each}
			<!-- Dynamically populated variable inputs -->
		</div>
		<button
			class="flex w-full items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
			class:disabled={isTesting}
			on:click={testPrompt}
		>
			{#if isTesting}
				<svg
					class="h-6 w-6 animate-spin text-white"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path class="opacity-1" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
					></path>
				</svg> Testing...
			{:else}
				Run Test
			{/if}
		</button>
		<div id="test-output" class="mt-6 rounded-lg border border-gray-700 bg-gray-800 p-4">
			<h3 class="mb-2 text-lg font-semibold">Output</h3>
			<p class="text-gray-300" id="output-text">{testResult}</p>
		</div>

		{#if testPrice != ''}
			<div
				id="test-output"
				class="mt-6 flex justify-between rounded-lg border border-gray-700 bg-gray-800 p-2"
			>
				<h3 class="mb-2 text-lg font-semibold">Price</h3>
				<p class="text-gray-300" id="output-text">{testPrice} $</p>
			</div>
		{/if}
		<button
			on:click={() => (isTestModalOpen = false)}
			class="mt-4 w-full rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
			>Close</button
		>
	</div>
</div>
