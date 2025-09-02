<!-- Enhanced card component for prompts and agents with better dark theme support -->
<script lang="ts">
	export let title: string;
	export let description: string = '';
	export let status: 'active' | 'inactive' | 'draft' | 'archived' = 'active';
	export let type: string = '';
	export let updatedAt: string = '';
	export let version: string = '';
	export let href: string = '';
	export let onDelete: (() => void) | null = null;
	export let onDuplicate: (() => void) | null = null;
	export let customActions: any[] = [];

	// Status configuration
	const statusConfig = {
		active: {
			color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
			dot: 'bg-green-500',
			label: 'Active'
		},
		inactive: {
			color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
			dot: 'bg-gray-500',
			label: 'Inactive'
		},
		draft: {
			color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
			dot: 'bg-yellow-500',
			label: 'Draft'
		},
		archived: {
			color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
			dot: 'bg-red-500',
			label: 'Archived'
		}
	};

	function formatDate(dateString: string): string {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getTypeColor(type: string): string {
		switch (type.toLowerCase()) {
			case 'chatbot':
				return 'bg-blue-500';
			case 'task':
				return 'bg-green-500';
			case 'workflow':
				return 'bg-purple-500';
			case 'api':
				return 'bg-orange-500';
			case 'prompt':
				return 'bg-indigo-500';
			default:
				return 'bg-gray-500';
		}
	}

	function getTypeIcon(type: string): string {
		switch (type.toLowerCase()) {
			case 'chatbot':
				return 'fas fa-comments';
			case 'task':
				return 'fas fa-tasks';
			case 'workflow':
				return 'fas fa-sitemap';
			case 'api':
				return 'fas fa-code';
			case 'prompt':
				return 'fas fa-magic';
			default:
				return 'fas fa-file-alt';
		}
	}
</script>

<div
	class="group relative overflow-hidden rounded-xl border border-gray-200/50 bg-white/80 transition-all duration-300 hover:border-gray-300/60 hover:bg-white hover:shadow-xl hover:shadow-gray-200/20 dark:border-gray-700/50 dark:bg-gray-800/80 dark:hover:border-gray-600/60 dark:hover:bg-gray-800 dark:hover:shadow-xl dark:hover:shadow-gray-900/20"
>
	<!-- Type accent line -->
	<div class="absolute left-0 top-0 h-1 w-full {getTypeColor(type)}"></div>

	<!-- Main content -->
	<div class="p-6">
		<!-- Header with status -->
		<div class="mb-4 flex items-start justify-between">
			<div class="flex items-center space-x-3">
				{#if type}
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg {getTypeColor(
							type
						)} shadow-lg"
					>
						<i class="{getTypeIcon(type)} text-white"></i>
					</div>
				{/if}
				<div class="flex-1">
					<h3
						class="text-lg font-semibold text-gray-900 transition-colors group-hover:text-gray-800 dark:text-gray-100 dark:group-hover:text-white"
					>
						{title}
					</h3>
					{#if type}
						<span
							class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
						>
							{type}
						</span>
					{/if}
				</div>
			</div>
			<span
				class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium {statusConfig[
					status
				].color}"
			>
				<span class="mr-1.5 h-1.5 w-1.5 rounded-full {statusConfig[status].dot}"></span>
				{statusConfig[status].label}
			</span>
		</div>

		<!-- Description -->
		{#if description}
			<p class="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
				{description}
			</p>
		{/if}

		<!-- Meta information -->
		<div class="mb-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
			{#if updatedAt}
				<span class="flex items-center space-x-1">
					<i class="fas fa-clock"></i>
					<span>{formatDate(updatedAt)}</span>
				</span>
			{/if}
			{#if version}
				<span class="flex items-center space-x-1">
					<i class="fas fa-code-branch"></i>
					<span>v{version}</span>
				</span>
			{/if}
		</div>

		<!-- Actions -->
		<div class="flex items-center justify-between">
			<a
				{href}
				class="inline-flex items-center space-x-2 rounded-lg {getTypeColor(
					type || 'default'
				)} px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
			>
				<i class="fas fa-external-link-alt"></i>
				<span>Open</span>
			</a>

			<div class="flex items-center space-x-1">
				<!-- Custom actions -->
				{#each customActions as action}
					<button
						on:click={action.onClick}
						class="rounded-lg p-2 text-gray-400 transition-all hover:scale-110 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700/50 dark:hover:text-gray-300"
						title={action.title}
						aria-label={action.title}
					>
						<i class={action.icon}></i>
					</button>
				{/each}

				<!-- Duplicate button -->
				{#if onDuplicate}
					<button
						on:click={onDuplicate}
						class="rounded-lg p-2 text-gray-400 transition-all hover:scale-110 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-500 dark:hover:bg-blue-600/10 dark:hover:text-blue-400"
						title="Duplicate"
						aria-label="Duplicate"
					>
						<i class="fas fa-copy"></i>
					</button>
				{/if}

				<!-- Delete button -->
				{#if onDelete}
					<button
						on:click={onDelete}
						class="rounded-lg p-2 text-gray-400 transition-all hover:scale-110 hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-600/10 dark:hover:text-red-400"
						title="Delete"
						aria-label="Delete"
					>
						<i class="fas fa-trash"></i>
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
