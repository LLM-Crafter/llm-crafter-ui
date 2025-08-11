<script lang="ts">
	import { onMount } from 'svelte';
	export let data;
	let userDropdownVisible: boolean = false;
	let sidebarCollapsed: boolean = false;
	let mobileMenuOpen: boolean = false;
	let isMobile: boolean = false;

	$: orgName = data.organizations.find((obj) => obj._id == data.organization_id)?.name || '';
	$: shortOrgName =
		isMobile && orgName.length > 8
			? orgName.substring(0, 8) + '...'
			: orgName.length > 10
				? orgName.substring(0, 10) + '...'
				: orgName;

	// Check if device is mobile
	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
			if (isMobile) {
				sidebarCollapsed = true;
			}
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		// Close dropdown when clicking outside
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Element;
			if (!target.closest('#profile-menu') && !target.closest('#profile-dropdown')) {
				userDropdownVisible = false;
			}
		};

		document.addEventListener('click', handleClickOutside);

		return () => {
			window.removeEventListener('resize', checkMobile);
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function toggleSidebar() {
		if (isMobile) {
			mobileMenuOpen = !mobileMenuOpen;
		} else {
			sidebarCollapsed = !sidebarCollapsed;
		}
	}

	function closeMobileMenu() {
		if (isMobile) {
			mobileMenuOpen = false;
		}
	}
</script>

<div class="flex min-h-screen">
	<!-- Mobile overlay -->
	{#if isMobile && mobileMenuOpen}
		<div
			class="fixed inset-0 z-40 bg-black bg-opacity-50"
			on:click={closeMobileMenu}
			on:keydown={(e) => e.key === 'Escape' && closeMobileMenu()}
			role="button"
			tabindex="0"
		></div>
	{/if}

	<!-- Sidebar -->
	<div
		id="sidebar"
		class="border-r border-gray-800 bg-gray-900 transition-all duration-300 ease-in-out
			{isMobile
			? `fixed inset-y-0 left-0 z-50 w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`
			: `relative ${sidebarCollapsed ? 'w-16' : 'w-64'}`}"
		style={isMobile && !mobileMenuOpen ? 'display: none;' : ''}
	>
		<div class="p-6">
			<!-- Collapse Button -->
			<button
				on:click={toggleSidebar}
				class="absolute {sidebarCollapsed && !isMobile
					? '-right-3'
					: 'right-4'} top-6 z-10 rounded-full bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
				aria-label={isMobile
					? 'Toggle mobile menu'
					: sidebarCollapsed
						? 'Expand sidebar'
						: 'Collapse sidebar'}
			>
				{#if isMobile}
					<i class="fas fa-times"></i>
				{:else}
					<i class="fas fa-chevron-{sidebarCollapsed ? 'right' : 'left'}"></i>
				{/if}
			</button>

			<!-- Logo -->
			<h2
				class="mb-6 flex items-center text-xl font-semibold text-gray-100 {sidebarCollapsed &&
				!isMobile
					? 'justify-center'
					: ''}"
			>
				<i class="fas fa-rocket {sidebarCollapsed && !isMobile ? '' : 'mr-2'}"></i>
				{#if !sidebarCollapsed || isMobile}
					<span class="nav-text">LLM Crafter</span>
				{/if}
			</h2>

			<!-- Navigation Links -->
			<nav class="space-y-1">
				<button
					type="button"
					class="flex w-full items-center rounded-lg px-4 py-2 text-gray-300 hover:bg-gray-800 {sidebarCollapsed &&
					!isMobile
						? 'justify-center'
						: ''}"
					on:click={closeMobileMenu}
				>
					<i class="fas fa-home {sidebarCollapsed && !isMobile ? '' : 'mr-2'}"></i>
					{#if !sidebarCollapsed || isMobile}
						<span class="nav-text">Dashboard</span>
					{/if}
				</button>
				<a
					href="/app/org/{data.organization_id}"
					class="flex items-center rounded-lg px-4 py-2 text-gray-300 hover:bg-gray-800 {sidebarCollapsed &&
					!isMobile
						? 'justify-center'
						: ''}"
					on:click={closeMobileMenu}
				>
					<i class="fas fa-folder {sidebarCollapsed && !isMobile ? '' : 'mr-2'}"></i>
					{#if !sidebarCollapsed || isMobile}
						<span class="nav-text">Projects</span>
					{/if}
				</a>
				{#if data.role === 'admin'}
					<a
						href="/app/org/{data.organization_id}/admin/users"
						class="flex items-center rounded-lg px-4 py-2 text-gray-300 hover:bg-gray-800 {sidebarCollapsed &&
						!isMobile
							? 'justify-center'
							: ''}"
						on:click={closeMobileMenu}
					>
						<i class="fas fa-cog {sidebarCollapsed && !isMobile ? '' : 'mr-2'}"></i>
						{#if !sidebarCollapsed || isMobile}
							<span class="nav-text">Users</span>
						{/if}
					</a>
				{/if}
			</nav>
		</div>
	</div>

	<!-- Main Content -->
	<div class="min-w-0 flex-1 bg-gray-950 transition-all duration-300 ease-in-out">
		<div class={isMobile ? 'p-4' : 'p-8'}>
			<!-- Header -->
			<header class="{isMobile ? 'mb-4' : 'mb-8'} flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<!-- Mobile menu button -->
					{#if isMobile}
						<button
							on:click={toggleSidebar}
							class="rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
							aria-label="Open sidebar"
						>
							<i class="fas fa-bars"></i>
						</button>
					{/if}
					<!-- Desktop sidebar toggle (hidden on mobile) -->
					{#if !isMobile}
						<button
							on:click={toggleSidebar}
							class="rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
							aria-label="Toggle sidebar"
						>
							<i class="fas fa-bars"></i>
						</button>
					{/if}
					<h1 class="{isMobile ? 'text-xl' : 'text-2xl'} font-semibold text-gray-100">Projects</h1>
				</div>
				<div class="flex items-center {isMobile ? 'space-x-2' : 'space-x-4'}">
					<!-- Organization Switcher -->
					<div class="relative">
						<button
							id="org-switcher"
							class="flex items-center space-x-2 rounded-lg border border-gray-800 bg-gray-900 {isMobile
								? 'px-2 py-1.5'
								: 'px-4 py-2'} text-gray-100 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<span class="hidden sm:inline {isMobile ? 'text-sm' : ''}">{orgName}</span>
							<span class="sm:hidden {isMobile ? 'text-sm' : ''}">{shortOrgName}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="{isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400"
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
							class="flex items-center space-x-2 rounded-lg border border-gray-800 bg-gray-900 {isMobile
								? 'px-2 py-1.5'
								: 'px-4 py-2'} text-gray-100 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<img
								src={`https://ui-avatars.com/api/?name=${data.user?.name}&bold=true`}
								alt="User Avatar"
								class="{isMobile ? 'h-6 w-6' : 'h-8 w-8'} rounded-full"
							/>
							<span class="hidden sm:inline {isMobile ? 'text-sm' : ''}">{data.user?.name}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="{isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400"
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
							class="absolute right-0 mt-2 {isMobile
								? 'w-40'
								: 'w-48'} z-50 rounded-lg border border-gray-800 bg-gray-900 shadow-lg"
						>
							<ul class="py-2">
								<li>
									<button
										type="button"
										class="flex w-full {isMobile
											? 'px-3 py-2 text-sm'
											: 'px-4 py-2'} text-left text-gray-300 hover:bg-gray-800">Profile</button
									>
								</li>
								<li>
									<button
										type="button"
										class="flex w-full {isMobile
											? 'px-3 py-2 text-sm'
											: 'px-4 py-2'} text-left text-gray-300 hover:bg-gray-800">Settings</button
									>
								</li>
								<li>
									<a
										href="/logout"
										data-sveltekit-reload
										class="flex {isMobile
											? 'px-3 py-2 text-sm'
											: 'px-4 py-2'} text-red-500 hover:bg-gray-800">Log Out</a
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
</div>
