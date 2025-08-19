<script lang="ts">
	import ThemeToggle from '$lib/ui/ThemeToggle.svelte';
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
	<!-- Theme Toggle -->
	<div class="absolute right-4 top-4">
		<ThemeToggle size="md" />
	</div>

	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<h1 class="mb-4 text-4xl font-bold text-gray-800 dark:text-gray-100">
				Welcome to LLM Crafter
			</h1>
			<p class="mb-8 text-gray-600 dark:text-gray-400">
				A powerful tool for crafting and managing LLM workflows
			</p>
			<div class="space-x-4">
				<a
					href="/login"
					class="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Login
				</a>
				<a
					href="/register"
					class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					Register
				</a>
			</div>
		</div>
	</div>
</div>
