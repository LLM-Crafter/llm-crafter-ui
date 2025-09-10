<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import ThemeToggle from '$lib/ui/ThemeToggle.svelte';
	import { browser } from '$app/environment';

	export let data;
	let createModalVisible = false;
	let orgName = '';
	let orgDescription = '';
	let selectedOrgId = '';
	let searchQuery = '';
	let rememberChoice = false;
	let isLoading = false;
	let isInitializing = true;

	// Filter organizations based on search query
	$: filteredOrganizations = data.organizations.filter(
		(org) =>
			org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(org.description && org.description.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	onMount(() => {
		// Check for remembered organization choice
		const rememberedOrgId = localStorage.getItem('preferredOrganization');
		const autoRedirect = localStorage.getItem('autoRedirectToOrg') === 'true';

		if (
			rememberedOrgId &&
			autoRedirect &&
			data.organizations.some((org) => org._id === rememberedOrgId)
		) {
			// Auto-redirect to remembered organization
			if (browser) {
				goto(`/app/org/${rememberedOrgId}`);
			}
			return; // Don't set isInitializing to false since we're redirecting
		} else if (rememberedOrgId && data.organizations.some((org) => org._id === rememberedOrgId)) {
			// Pre-select the remembered organization
			selectedOrgId = rememberedOrgId;
			rememberChoice = true;
		}

		// Set initialization complete after a short delay to ensure smooth transition
		setTimeout(() => {
			isInitializing = false;
		}, 100);
	});

	async function handleCreateOrganization(event: Event) {
		event.preventDefault();
		isLoading = true;
		try {
			const newOrg = await api.createOrganization({ name: orgName, description: orgDescription });
			data.organizations.push(newOrg);
			createModalVisible = false;
			orgName = '';
			orgDescription = '';
			invalidateAll();
		} catch (error) {
			console.error('Error creating organization:', error);
		} finally {
			isLoading = false;
		}
	}

	function handleSelectOrganization(orgId: string) {
		selectedOrgId = orgId;

		// Save preference if remember choice is enabled
		if (rememberChoice) {
			localStorage.setItem('preferredOrganization', orgId);
			localStorage.setItem('autoRedirectToOrg', 'true');
		} else {
			localStorage.removeItem('preferredOrganization');
			localStorage.removeItem('autoRedirectToOrg');
		}

		if (browser) {
			goto(`/app/org/${orgId}`);
		}
	}

	function toggleRememberChoice() {
		if (!rememberChoice) {
			localStorage.removeItem('preferredOrganization');
			localStorage.removeItem('autoRedirectToOrg');
		}
	}

	function clearRememberedChoice() {
		localStorage.removeItem('preferredOrganization');
		localStorage.removeItem('autoRedirectToOrg');
		rememberChoice = false;
		selectedOrgId = '';
	}
</script>

<div
	id="organization-screen"
	class="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-950 dark:to-black"
>
	<!-- Theme Toggle -->
	<div class="absolute right-4 top-4 z-10">
		<ThemeToggle size="md" />
	</div>

	{#if isInitializing}
		<!-- Loading State -->
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center">
				<div class="mb-4 inline-block">
					<svg class="h-12 w-12 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				</div>
				<p class="text-lg text-gray-600 dark:text-gray-400">Loading organizations...</p>
			</div>
		</div>
	{:else}
		<!-- Main Content -->
		<div class="flex min-h-screen items-center justify-center p-4">
			<div class="w-full max-w-4xl">
				<!-- Header -->
				<div class="mb-8 text-center">
					<h1 class="mb-2 text-4xl font-bold text-gray-800 dark:text-white">Welcome Back!</h1>
					<p class="text-lg text-gray-600 dark:text-gray-400">
						Choose your organization to continue
					</p>
				</div>

				<!-- Search Bar -->
				{#if data.organizations.length > 3}
					<div class="mb-6">
						<div class="relative">
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Search organizations..."
								class="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-3 pl-10 text-gray-800 placeholder-gray-500 backdrop-blur-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder-gray-400"
							/>
							<svg
								class="absolute left-3 top-3.5 h-5 w-5 text-gray-500 dark:text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								></path>
							</svg>
						</div>
					</div>
				{/if}

				<!-- Organizations Grid -->
				<div
					class="mb-8 grid gap-4 {data.organizations.length === 1
						? 'mx-auto max-w-md grid-cols-1'
						: data.organizations.length === 2
							? 'mx-auto max-w-2xl grid-cols-1 md:grid-cols-2'
							: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}"
				>
					{#each filteredOrganizations as org, index}
						<div
							class="org-card group relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-200
							{selectedOrgId === org._id
								? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
								: 'border-gray-300 bg-white/30 hover:border-gray-400 hover:bg-white/50 dark:border-gray-600 dark:bg-gray-800/30 dark:hover:border-gray-500 dark:hover:bg-gray-800/50'} backdrop-blur-sm"
							style="animation-delay: {index * 0.1}s"
							on:click={() => handleSelectOrganization(org._id)}
							on:keydown={(e) => e.key === 'Enter' && handleSelectOrganization(org._id)}
							role="button"
							tabindex="0"
						>
							<!-- Selection indicator -->
							{#if selectedOrgId === org._id}
								<div
									class="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500"
								>
									<svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										></path>
									</svg>
								</div>
							{/if}

							<div class="p-6">
								<!-- Organization Icon/Avatar -->
								<div
									class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white"
								>
									{org.name.charAt(0).toUpperCase()}
								</div>

								<h3
									class="mb-2 text-xl font-semibold text-gray-800 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400"
								>
									{org.name}
								</h3>

								{#if org.description}
									<p class="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
										{org.description}
									</p>
								{/if}

								<!-- Metadata -->
								<div
									class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
								>
									<span class="flex items-center">
										<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
											></path>
										</svg>
										Organization
									</span>
									<span>#{org._id.slice(-6)}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- No results message -->
				{#if searchQuery && filteredOrganizations.length === 0}
					<div class="py-8 text-center">
						<div class="mb-4 text-gray-600 dark:text-gray-400">
							<svg
								class="mx-auto mb-4 h-16 w-16 opacity-50"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								></path>
							</svg>
							<p class="text-lg">No organizations found matching "{searchQuery}"</p>
							<p class="text-sm">Try adjusting your search or create a new organization</p>
						</div>
					</div>
				{/if}

				<!-- Remember Choice Section -->
				<div class="mb-6 flex flex-col items-center space-y-2">
					<label class="flex cursor-pointer items-center">
						<input
							type="checkbox"
							bind:checked={rememberChoice}
							on:change={toggleRememberChoice}
							class="custom-checkbox"
						/>
						<span class="ml-3 text-sm text-gray-600 dark:text-gray-400">
							Remember my choice and skip this screen next time
						</span>
					</label>

					{#if localStorage.getItem('preferredOrganization')}
						<button
							on:click={clearRememberedChoice}
							class="text-xs text-gray-500 underline hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-300"
						>
							Clear remembered organization
						</button>
					{/if}
				</div>

				<!-- Action Buttons -->
				<div class="flex flex-col justify-center gap-4 sm:flex-row">
					<button
						on:click={() => selectedOrgId && handleSelectOrganization(selectedOrgId)}
						disabled={!selectedOrgId}
						class="rounded-xl px-8 py-3 font-medium transition-all duration-200
						{selectedOrgId
							? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl'
							: 'cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}
						focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900"
					>
						Continue to Organization
					</button>

					<button
						on:click={() => (createModalVisible = true)}
						class="rounded-xl border border-gray-400 px-8 py-3 font-medium text-gray-700 transition-all duration-200 hover:border-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-800 dark:focus:ring-offset-gray-900"
					>
						Create New Organization
					</button>
				</div>

				<!-- Quick stats -->
				<div class="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
					<p>
						You have access to {data.organizations.length} organization{data.organizations
							.length !== 1
							? 's'
							: ''}
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Create Organization Modal -->
<div
	id="create-org-modal"
	class:hidden={!createModalVisible}
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
>
	<div
		class="w-full max-w-md rounded-2xl border border-gray-200 bg-white/95 p-8 shadow-2xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95"
	>
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-2xl font-bold text-gray-800 dark:text-white">Create Organization</h2>
			<button
				on:click={() => (createModalVisible = false)}
				class="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
				aria-label="Close modal"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					></path>
				</svg>
			</button>
		</div>

		<form id="create-org-form" on:submit={handleCreateOrganization} class="space-y-6">
			<div>
				<label
					for="org-name"
					class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Organization Name
				</label>
				<input
					type="text"
					id="org-name"
					bind:value={orgName}
					placeholder="Enter organization name"
					class="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-3 text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder-gray-400"
					required
					disabled={isLoading}
				/>
			</div>

			<div>
				<label
					for="org-description"
					class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Description
				</label>
				<textarea
					id="org-description"
					placeholder="What does your organization do?"
					bind:value={orgDescription}
					class="w-full resize-none rounded-xl border border-gray-300 bg-white/50 px-4 py-3 text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder-gray-400"
					rows="3"
					required
					disabled={isLoading}
				></textarea>
			</div>

			<div class="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
				<button
					on:click={() => (createModalVisible = false)}
					type="button"
					id="close-create-org-modal"
					class="flex-1 rounded-xl border border-gray-400 px-4 py-3 text-gray-700 transition-all duration-200 hover:border-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-800"
					disabled={isLoading}
				>
					Cancel
				</button>
				<button
					type="submit"
					class="flex flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-white transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={isLoading}
				>
					{#if isLoading}
						<svg class="-ml-1 mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Creating...
					{:else}
						Create Organization
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
