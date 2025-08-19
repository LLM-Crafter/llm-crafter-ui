<script lang="ts">
	import CreateProjectModal from '$lib/ui/modal/CreateProjectModal.svelte';
	import { createEventDispatcher } from 'svelte';

	export let data;
	const dispatch = createEventDispatcher();

	let showModal = false;
	let searchQuery = '';
	let isLoading = false;

	// Filter projects based on search query
	$: filteredProjects = data.projects.filter(
		(project) =>
			project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	function handleCreated(newProject) {
		// Close modal
		showModal = false;
		// Optional: append project to the list locally
		data.projects = [newProject, ...data.projects];
	}

	function formatDate(dateString) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="min-h-screen">
	<!-- Hero Section -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600"
				>
					<i class="fas fa-folder text-xl text-white"></i>
				</div>
				<div>
					<h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">Projects</h1>
					<p class="text-gray-600 dark:text-gray-400">Manage your AI projects and collaborate with your team</p>
				</div>
			</div>
			<button
				class="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-950"
				on:click={() => (showModal = true)}
			>
				<i class="fas fa-plus"></i>
				<span>Create Project</span>
			</button>
		</div>
	</div>

	<!-- Search Bar -->
	{#if data.projects.length > 0}
		<div class="mb-8">
			<div class="relative max-w-md">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search projects..."
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

	<!-- Projects Grid -->
	{#if data.projects.length > 0}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredProjects as project, index}
				<div
					class="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white/30 p-6 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-gray-300 hover:bg-white/50 hover:shadow-xl hover:shadow-blue-500/10 dark:border-gray-700 dark:bg-gray-800/30 dark:hover:border-gray-600 dark:hover:bg-gray-800/50"
					style="animation-delay: {index * 0.1}s"
				>
					<!-- Project Icon/Avatar -->
					<div class="mb-4 flex items-center justify-between">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-blue-600 text-lg font-bold text-white"
						>
							{project.name.charAt(0).toUpperCase()}
						</div>
						<div class="text-xs text-gray-500 dark:text-gray-400">
							#{project._id.slice(-6)}
						</div>
					</div>

					<h3
						class="mb-2 text-xl font-semibold text-gray-800 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400"
					>
						{project.name}
					</h3>

					{#if project.description}
						<p class="mb-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
							{project.description}
						</p>
					{:else}
						<p class="mb-4 text-sm italic text-gray-500 dark:text-gray-500">No description provided</p>
					{/if}

					<!-- Metadata -->
					<div class="mb-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
						<span class="flex items-center">
							<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8h12m0 0l-3-3m3 3l-3 3"
								></path>
							</svg>
							Project
						</span>
						{#if project.createdAt}
							<span>Created {formatDate(project.createdAt)}</span>
						{/if}
					</div>

					<!-- Action Button -->
					<div class="w-full">
						<a
							href={`/app/org/${data.organization_id}/project/${project._id}`}
							class="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
						>
							<i class="fas fa-arrow-right"></i>
							<span>Open Project</span>
						</a>
					</div>
				</div>
			{/each}
		</div>

		<!-- No search results -->
		{#if searchQuery && filteredProjects.length === 0}
			<div class="py-12 text-center">
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
					<p class="text-lg font-medium">No projects found matching "{searchQuery}"</p>
					<p class="text-sm">Try adjusting your search or create a new project</p>
				</div>
				<button
					on:click={() => (showModal = true)}
					class="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					<i class="fas fa-plus"></i>
					<span>Create New Project</span>
				</button>
			</div>
		{/if}
	{:else}
		<!-- Empty State -->
		<div class="flex min-h-[400px] items-center justify-center">
			<div class="text-center">
				<div class="mb-6">
					<div
						class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600"
					>
						<i class="fas fa-folder text-2xl text-white"></i>
					</div>
					<h3 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-gray-100">No Projects Yet</h3>
					<p class="mb-6 max-w-md text-gray-600 dark:text-gray-400">
						Get started by creating your first project. Organize your AI prompts, agents, and
						collaborate with your team.
					</p>
				</div>
				<button
					on:click={() => (showModal = true)}
					class="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-950"
				>
					<i class="fas fa-plus"></i>
					<span>Create Your First Project</span>
				</button>
			</div>
		</div>
	{/if}

	<!-- Project Stats -->
	{#if data.projects.length > 0}
		<div class="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
			<p>
				{data.projects.length} project{data.projects.length === 1 ? '' : 's'} total
				{#if searchQuery && filteredProjects.length !== data.projects.length}
					• {filteredProjects.length} shown
				{/if}
			</p>
		</div>
	{/if}
</div>

{#if showModal}
	<CreateProjectModal
		{data}
		on:close={() => (showModal = false)}
		on:created={(e) => handleCreated(e.detail)}
	/>
{/if}
