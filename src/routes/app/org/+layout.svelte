<script lang="ts">
	export let data;
	let userDropdownVisible: boolean = false;
</script>

<div class="flex min-h-screen">
	<!-- Sidebar -->
	<div id="sidebar" class="relative w-64 border-r border-gray-800 bg-gray-900 p-6">
		<!-- Collapse Button -->
		<button
			class="absolute -right-3 top-6 rounded-full bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			<i class="fas fa-chevron-left"></i>
		</button>

		<!-- Logo -->
		<h2 class="mb-6 flex items-center text-xl font-semibold text-gray-100">
			<i class="fas fa-rocket mr-2"></i>
			<span class="nav-text">LLM Crafter</span>
		</h2>

		<!-- Navigation Links -->
		<nav>
			<a
				href="#"
				class="block flex items-center rounded-lg px-4 py-2 text-gray-300 hover:bg-gray-800"
			>
				<i class="fas fa-home mr-2"></i>
				<span class="nav-text">Dashboard</span>
			</a>
			<a
				href="/app/org/{data.organization_id}"
				class="block flex items-center rounded-lg px-4 py-2 text-gray-300 hover:bg-gray-800"
			>
				<i class="fas fa-folder mr-2"></i>
				<span class="nav-text">Projects</span>
			</a>
			{#if data.role === 'admin'}
				<a
					href="/app/org/{data.organization_id}/admin/users"
					class="block flex items-center rounded-lg px-4 py-2 text-gray-300 hover:bg-gray-800"
				>
					<i class="fas fa-cog mr-2"></i>
					<span class="nav-text">Users</span>
				</a>
			{/if}
		</nav>
	</div>

	<!-- Main Content -->
	<div class="flex-1 bg-gray-950 p-8">
		<!-- Header -->
		<header class="mb-8 flex items-center justify-between">
			<h1 class="text-2xl font-semibold text-gray-100">Projects</h1>
			<div class="flex items-center space-x-4">
				<!-- Organization Switcher -->
				<div class="relative">
					<button
						id="org-switcher"
						class="flex items-center space-x-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-gray-100 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<span>{data.organizations.find((obj) => obj._id == data.organization_id)?.name}</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-gray-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>

				<!-- User Profile -->
				<div class="relative">
					<button
						on:click={() => (userDropdownVisible = !userDropdownVisible)}
						id="profile-menu"
						class="flex items-center space-x-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-gray-100 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<img
							src={`https://ui-avatars.com/api/?name=${data.user.name}&bold=true`}
							alt="User Avatar"
							class="h-8 w-8 rounded-full"
						/>
						<span>{data.user.name}</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-gray-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
					<div
						id="profile-dropdown"
						class:hidden={!userDropdownVisible}
						class="absolute right-0 mt-2 w-48 rounded-lg border border-gray-800 bg-gray-900 shadow-lg"
					>
						<ul class="py-2">
							<li>
								<a href="#" class="block px-4 py-2 text-gray-300 hover:bg-gray-800">Profile</a>
							</li>
							<li>
								<a href="#" class="block px-4 py-2 text-gray-300 hover:bg-gray-800">Settings</a>
							</li>
							<li>
								<a
									href="/logout"
									data-sveltekit-reload
									class="block px-4 py-2 text-red-500 hover:bg-gray-800">Log Out</a
								>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</header>

		<slot />
	</div>
</div>
