<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { api } from '$lib/api';

	export let data: any = undefined;
	export let agent: any;
	const dispatch = createEventDispatcher();

	let loading = false;
	let saving = false;
	let error = '';
	let faqs: Array<{
		question: string;
		answer: string;
		category?: string;
	}> = [];
	let showAddFaq = false;

	// New FAQ form
	let newFaq = {
		question: '',
		answer: '',
		category: ''
	};

	// Categories for organizing FAQs
	let categories: string[] = [];
	let selectedCategory = '';

	onMount(async () => {
		await loadFaqConfiguration();
	});

	async function loadFaqConfiguration() {
		try {
			loading = true;
			error = '';

			const response = await api.fetch(
				`/organizations/${data.organization_id}/projects/${data.project._id}/agents/${agent._id}/faq-config`
			);

			if (response.ok) {
				const config = await response.json();
				faqs = config.faqs || [];
				updateCategories();
			} else if (response.status === 404) {
				// No FAQ configuration exists yet, start with empty array
				faqs = [];
			} else {
				const errorData = await response.json();
				error = errorData.message || 'Failed to load FAQ configuration';
			}
		} catch (err) {
			console.error('Failed to load FAQ configuration:', err);
			error = 'Failed to load FAQ configuration';
		} finally {
			loading = false;
		}
	}

	async function saveFaqConfiguration() {
		try {
			saving = true;
			error = '';

			const response = await api.fetch(
				`/organizations/${data.organization_id}/projects/${data.project._id}/agents/${agent._id}/faq-config`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ faqs })
				}
			);

			if (response.ok) {
				dispatch('close');
			} else {
				const errorData = await response.json();
				error = errorData.message || 'Failed to save FAQ configuration';
			}
		} catch (err) {
			console.error('Failed to save FAQ configuration:', err);
			error = 'Failed to save FAQ configuration';
		} finally {
			saving = false;
		}
	}

	function addFaq() {
		if (!newFaq.question.trim() || !newFaq.answer.trim()) {
			error = 'Question and answer are required';
			return;
		}

		faqs = [
			...faqs,
			{
				question: newFaq.question.trim(),
				answer: newFaq.answer.trim(),
				category: newFaq.category.trim() || undefined
			}
		];

		// Reset form
		newFaq = {
			question: '',
			answer: '',
			category: ''
		};

		updateCategories();
		showAddFaq = false;
		error = '';
	}

	function removeFaq(index: number) {
		faqs = faqs.filter((_, i) => i !== index);
		updateCategories();
	}

	function updateCategories() {
		const uniqueCategories = [...new Set(faqs.map(faq => faq.category).filter(Boolean))] as string[];
		categories = uniqueCategories.sort();
	}

	function getFilteredFaqs() {
		if (!selectedCategory) {
			return faqs;
		}
		return faqs.filter(faq => faq.category === selectedCategory);
	}

	function exportFaqs() {
		const dataStr = JSON.stringify(faqs, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${agent.name}-faqs.json`;
		link.click();
		URL.revokeObjectURL(url);
	}

	function handleImport(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const importedFaqs = JSON.parse(e.target?.result as string);
				if (Array.isArray(importedFaqs)) {
					faqs = [...faqs, ...importedFaqs.filter(faq => faq.question && faq.answer)];
					updateCategories();
					error = '';
				} else {
					error = 'Invalid JSON format. Expected an array of FAQ objects.';
				}
			} catch (err) {
				error = 'Failed to parse JSON file';
			}
		};
		reader.readAsText(file);
	}
</script>

<!-- Modal Backdrop -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
	<div
		class="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900 flex flex-col"
	>
		<!-- Modal Header -->
		<div class="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700 flex-shrink-0">
			<div class="flex items-center space-x-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
					<i class="fas fa-question-circle text-white"></i>
				</div>
				<div>
					<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
						Configure FAQ for {agent.name}
					</h2>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Manage frequently asked questions for your agent
					</p>
				</div>
			</div>
			<button
				on:click={() => dispatch('close')}
				aria-label="Close modal"
				class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
			>
				<i class="fas fa-times"></i>
			</button>
		</div>

		<!-- Modal Content -->
		<div class="flex-1 overflow-y-auto p-6">
				{#if loading}
					<div class="flex items-center justify-center py-12">
						<div class="text-center">
							<div
								class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
							></div>
							<p class="text-gray-600 dark:text-gray-400">Loading FAQ configuration...</p>
						</div>
					</div>
				{:else}
					<!-- Error Message -->
					{#if error}
						<div class="mb-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
							<div class="flex items-center">
								<i class="fas fa-exclamation-triangle mr-2 text-red-500"></i>
								<p class="text-red-700 dark:text-red-400">{error}</p>
							</div>
						</div>
					{/if}

					<!-- Actions Bar -->
					<div class="mb-6 flex items-center justify-between">
						<div class="flex items-center space-x-3">
							<button
								on:click={() => (showAddFaq = true)}
								class="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
							>
								<i class="fas fa-plus"></i>
								<span>Add FAQ</span>
							</button>

							<!-- Category Filter -->
							{#if categories.length > 0}
								<select
									bind:value={selectedCategory}
									class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
								>
									<option value="">All Categories</option>
									{#each categories as category}
										<option value={category}>{category}</option>
									{/each}
								</select>
							{/if}
						</div>

						<div class="flex items-center space-x-2">
							<!-- Import/Export -->
							<input
								type="file"
								accept=".json"
								on:change={handleImport}
								class="hidden"
								id="import-faqs"
							/>
							<label
								for="import-faqs"
								class="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
							>
								<i class="fas fa-upload mr-1"></i>
								Import
							</label>
							{#if faqs.length > 0}
								<button
									on:click={exportFaqs}
									class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
								>
									<i class="fas fa-download mr-1"></i>
									Export
								</button>
							{/if}
						</div>
					</div>

					<!-- Add FAQ Form -->
					{#if showAddFaq}
						<div class="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
							<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">Add New FAQ</h3>
							<div class="space-y-4">
								<div>
									<label for="faq-question" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
										Question *
									</label>
									<input
										id="faq-question"
										type="text"
										bind:value={newFaq.question}
										placeholder="Enter the frequently asked question..."
										class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
									/>
								</div>
								<div>
									<label for="faq-answer" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
										Answer *
									</label>
									<textarea
										id="faq-answer"
										bind:value={newFaq.answer}
										placeholder="Enter the answer to this question..."
										rows="3"
										class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
									></textarea>
								</div>
								<div>
									<label for="faq-category" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
										Category (Optional)
									</label>
									<input
										id="faq-category"
										type="text"
										bind:value={newFaq.category}
										placeholder="e.g., General, Product, Billing..."
										class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
									/>
								</div>
								<div class="flex justify-end space-x-3">
									<button
										on:click={() => (showAddFaq = false)}
										class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
									>
										Cancel
									</button>
									<button
										on:click={addFaq}
										class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
									>
										Add FAQ
									</button>
								</div>
							</div>
						</div>
					{/if}

					<!-- FAQ List -->
					{#if faqs.length === 0}
						<div class="py-12 text-center">
							<div
								class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10"
							>
								<i class="fas fa-question-circle text-2xl text-blue-600 dark:text-blue-400"></i>
							</div>
							<h3 class="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">
								No FAQs configured
							</h3>
							<p class="mb-6 text-gray-600 dark:text-gray-400">
								Add frequently asked questions to help your agent provide better responses.
							</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each getFilteredFaqs() as faq, index}
								<div
									class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
								>
									<div class="flex items-start justify-between">
										<div class="flex-1">
											{#if faq.category}
												<span
													class="mb-2 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
												>
													{faq.category}
												</span>
											{/if}
											<h4 class="mb-2 font-medium text-gray-900 dark:text-gray-100">
												{faq.question}
											</h4>
											<p class="text-gray-600 dark:text-gray-400">
												{faq.answer}
											</p>
										</div>
										<button
											on:click={() => removeFaq(faqs.indexOf(faq))}
											aria-label="Remove FAQ"
											class="ml-4 rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
										>
											<i class="fas fa-trash"></i>
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
		</div>

		<!-- Modal Footer -->
		<div class="flex items-center justify-between border-t border-gray-200 p-6 dark:border-gray-700 flex-shrink-0">
			<div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
				<i class="fas fa-info-circle mr-2"></i>
				{faqs.length} FAQ{faqs.length !== 1 ? 's' : ''} configured
			</div>
			<div class="flex space-x-3">
				<button
					on:click={() => dispatch('close')}
					disabled={saving}
					class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Cancel
				</button>
				<button
					on:click={saveFaqConfiguration}
					disabled={saving}
					class="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{#if saving}
						<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
