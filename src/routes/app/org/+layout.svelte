<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ProfileModal from '$lib/ui/modal/ProfileModal.svelte';
	import ThemeToggle from '$lib/ui/ThemeToggle.svelte';

	export let data;
	let userDropdownVisible: boolean = false;
	let sidebarCollapsed: boolean = false;
	let mobileMenuOpen: boolean = false;
	let isMobile: boolean = false;
	let showProfileModal: boolean = false;
	let orgDropdownVisible: boolean = false;

	$: orgName = data.organizations.find((obj) => obj._id == data.organization_id)?.name || '';
	$: shortOrgName =
		isMobile && orgName.length > 8
			? orgName.substring(0, 8) + '...'
			: orgName.length > 10
				? orgName.substring(0, 10) + '...'
				: orgName;

	// Dynamic page title based on current route
	$: pageTitle = (() => {
		const url = $page.url.pathname;
		if (url.includes('/dashboard')) return 'Dashboard';
		if (url.includes('/admin/users')) return 'Users';
		if (url.includes('/admin/api-keys')) return 'API Keys';
		if (url.includes('/project/')) {
			if (url.includes('/agents')) return 'Agents';
			if (url.includes('/config')) return 'Configuration';
			if (url.includes('/prompt/')) return 'Prompt';
			if (url.includes('/add')) return 'Add Agent';
			return 'Project';
		}
		return 'Projects';
	})();

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
			if (!target.closest('#org-switcher') && !target.closest('#org-dropdown')) {
				orgDropdownVisible = false;
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

	function openProfileModal() {
		showProfileModal = true;
		userDropdownVisible = false;
	}

	function closeProfileModal() {
		showProfileModal = false;
	}

	function handleProfileUpdate(event: CustomEvent) {
		// Update the user data locally
		data.user = { ...data.user, ...event.detail };
		closeProfileModal();
	}

	function switchOrganization() {
		// Clear auto-redirect preference and go back to organization picker
		localStorage.removeItem('autoRedirectToOrg');
		orgDropdownVisible = false;
		goto('/app');
	}

	function toggleOrgDropdown() {
		orgDropdownVisible = !orgDropdownVisible;
		// Close user dropdown if open
		userDropdownVisible = false;
	}
</script>

<div class="flex min-h-screen bg-gray-50 dark:bg-gray-900">
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
		class="border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900
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
					: 'right-4'} top-6 z-10 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
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
				class="mb-6 flex items-center text-xl font-semibold text-gray-800 dark:text-gray-100 {sidebarCollapsed &&
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
				<a
					href="/app/org/{data.organization_id}/dashboard"
					class="flex w-full items-center rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 {sidebarCollapsed &&
					!isMobile
						? 'justify-center'
						: ''}"
					on:click={closeMobileMenu}
				>
					<i class="fas fa-home {sidebarCollapsed && !isMobile ? '' : 'mr-2'}"></i>
					{#if !sidebarCollapsed || isMobile}
						<span class="nav-text">Dashboard</span>
					{/if}
				</a>
				<a
					href="/app/org/{data.organization_id}"
					class="flex items-center rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 {sidebarCollapsed &&
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
						class="flex items-center rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 {sidebarCollapsed &&
						!isMobile
							? 'justify-center'
							: ''}"
						on:click={closeMobileMenu}
					>
						<i class="fas fa-users {sidebarCollapsed && !isMobile ? '' : 'mr-2'}"></i>
						{#if !sidebarCollapsed || isMobile}
							<span class="nav-text">Users</span>
						{/if}
					</a>
					<a
						href="/app/org/{data.organization_id}/admin/api-keys"
						class="flex items-center rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 {sidebarCollapsed &&
						!isMobile
							? 'justify-center'
							: ''}"
						on:click={closeMobileMenu}
					>
						<i class="fas fa-key {sidebarCollapsed && !isMobile ? '' : 'mr-2'}"></i>
						{#if !sidebarCollapsed || isMobile}
							<span class="nav-text">API Keys</span>
						{/if}
					</a>
				{/if}
			</nav>
		</div>
	</div>

	<!-- Main Content -->
	<div class="min-w-0 flex-1 bg-gray-50 transition-all duration-300 ease-in-out dark:bg-gray-950">
		<div class={isMobile ? 'p-4' : 'p-8'}>
			<!-- Header -->
			<header class="{isMobile ? 'mb-4' : 'mb-8'} flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<!-- Mobile menu button -->
					{#if isMobile}
						<button
							on:click={toggleSidebar}
							class="rounded-md bg-gray-200 p-2 text-gray-600 hover:bg-gray-300 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
							aria-label="Open sidebar"
						>
							<i class="fas fa-bars"></i>
						</button>
					{/if}
					<!-- Desktop sidebar toggle (hidden on mobile) -->
					{#if !isMobile}
						<button
							on:click={toggleSidebar}
							class="rounded-md bg-gray-200 p-2 text-gray-600 hover:bg-gray-300 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100 lg:hidden"
							aria-label="Toggle sidebar"
						>
							<i class="fas fa-bars"></i>
						</button>
					{/if}
					<h1
						class="{isMobile
							? 'text-xl'
							: 'text-2xl'} font-semibold text-gray-800 dark:text-gray-100"
					>
						{pageTitle}
					</h1>
				</div>
				<div class="flex items-center {isMobile ? 'space-x-2' : 'space-x-4'}">
					<!-- Organization Switcher -->
					<div class="relative">
						<button
							id="org-switcher"
							on:click={toggleOrgDropdown}
							class="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white {isMobile
								? 'px-2 py-1.5'
								: 'px-4 py-2'} text-gray-800 transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
							title="Organization options"
						>
							<i
								class="fas fa-building {isMobile
									? 'text-xs'
									: 'text-sm'} text-gray-500 dark:text-gray-400"
							></i>
							<span class="hidden sm:inline {isMobile ? 'text-sm' : ''}">{orgName}</span>
							<span class="sm:hidden {isMobile ? 'text-sm' : ''}">{shortOrgName}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="{isMobile
									? 'h-4 w-4'
									: 'h-5 w-5'} text-gray-500 transition-transform duration-200 dark:text-gray-400 {orgDropdownVisible
									? 'rotate-180'
									: ''}"
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

						<!-- Organization Dropdown -->
						<div
							id="org-dropdown"
							class:hidden={!orgDropdownVisible}
							class="absolute right-0 mt-2 {isMobile
								? 'w-48'
								: 'w-56'} z-50 rounded-lg border border-gray-200 bg-white shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800"
						>
							<div class="py-2">
								<!-- Current Organization Info -->
								<div class="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
									<div class="flex items-center space-x-3">
										<div
											class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white"
										>
											{orgName.charAt(0).toUpperCase()}
										</div>
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
												{orgName}
											</p>
											<p class="text-xs text-gray-500 dark:text-gray-400">Current organization</p>
										</div>
									</div>
								</div>

								<!-- Actions -->
								<div class="py-1">
									<button
										type="button"
										on:click={switchOrganization}
										class="flex w-full items-center {isMobile
											? 'px-3 py-2 text-sm'
											: 'px-4 py-2'} text-left text-gray-700 transition-colors duration-200 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
									>
										<i
											class="fas fa-exchange-alt {isMobile
												? 'text-xs'
												: 'text-sm'} mr-3 text-gray-500 dark:text-gray-400"
										></i>
										<span>Switch Organization</span>
									</button>

									<button
										type="button"
										class="flex w-full items-center {isMobile
											? 'px-3 py-2 text-sm'
											: 'px-4 py-2'} text-left text-gray-700 transition-colors duration-200 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
									>
										<i
											class="fas fa-cog {isMobile
												? 'text-xs'
												: 'text-sm'} mr-3 text-gray-500 dark:text-gray-400"
										></i>
										<span>Organization Settings</span>
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- User Profile -->
					<div class="relative">
						<button
							on:click={() => (userDropdownVisible = !userDropdownVisible)}
							id="profile-menu"
							class="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white {isMobile
								? 'px-2 py-1.5'
								: 'px-4 py-2'} text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
						>
							<img
								src={`https://ui-avatars.com/api/?name=${data.user?.name}&bold=true`}
								alt="User Avatar"
								class="{isMobile ? 'h-6 w-6' : 'h-8 w-8'} rounded-full"
							/>
							<span class="hidden sm:inline {isMobile ? 'text-sm' : ''}">{data.user?.name}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="{isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-500 dark:text-gray-400"
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
								: 'w-48'} z-50 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
						>
							<ul class="py-2">
								<li>
									<button
										type="button"
										on:click={openProfileModal}
										class="flex w-full {isMobile
											? 'px-3 py-2 text-sm'
											: 'px-4 py-2'} text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
										>Profile</button
									>
								</li>
								<li>
									<button
										type="button"
										class="flex w-full {isMobile
											? 'px-3 py-2 text-sm'
											: 'px-4 py-2'} text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
										>Settings</button
									>
								</li>
								<!-- Theme Toggle -->
								<li class="border-t border-gray-200 pt-2 dark:border-gray-600">
									<div
										class="flex items-center justify-between {isMobile ? 'px-3 py-2' : 'px-4 py-2'}"
									>
										<span class="text-gray-700 dark:text-gray-300 {isMobile ? 'text-sm' : ''}"
											>Theme</span
										>
										<ThemeToggle size="sm" />
									</div>
								</li>
								<li class="border-t border-gray-200 pt-1 dark:border-gray-600">
									<a
										href="/logout"
										data-sveltekit-reload
										class="flex {isMobile
											? 'px-3 py-2 text-sm'
											: 'px-4 py-2'} text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
										>Log Out</a
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

<!-- Profile Modal -->
{#if showProfileModal}
	<ProfileModal {data} on:close={closeProfileModal} on:updated={handleProfileUpdate} />
{/if}
