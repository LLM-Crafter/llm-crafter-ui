<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/api.js';
	import { theme } from '$lib/stores/theme';

	export let data;

	let email = '';
	let role = 'editor';
	let isInviting = false;
	let showInviteForm = false;
	let searchQuery = '';

	// Filter users based on search query
	$: filteredUsers = (data.organization?.members || []).filter(
		(member: any) =>
			member.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			member.role.toLowerCase().includes(searchQuery.toLowerCase())
	);

	async function inviteUser() {
		if (!email || !role || !data.organization_id) return;

		try {
			isInviting = true;
			let response = await api.inviteUserToOrg(data.organization_id, email, role);

			if (response) {
				email = '';
				role = 'editor';
				showInviteForm = false;
				invalidateAll();
			}
		} catch (error) {
			console.error('Failed to invite user:', error);
		} finally {
			isInviting = false;
		}
	}

	async function removeUser(user_id: string) {
		if (
			!confirm('Are you sure you want to remove this user from the organization?') ||
			!data.organization_id
		) {
			return;
		}

		try {
			let response = await api.deleteUserFromOrg(data.organization_id, user_id);
			if (response) {
				invalidateAll();
			}
		} catch (error) {
			console.error('Failed to remove user:', error);
		}
	}

	function getRoleIcon(role: string) {
		switch (role) {
			case 'admin':
				return 'fas fa-crown';
			case 'editor':
				return 'fas fa-user-edit';
			case 'viewer':
				return 'fas fa-eye';
			default:
				return 'fas fa-user';
		}
	}

	function getRoleColor(role: string) {
		switch (role) {
			case 'admin':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
			case 'editor':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
			case 'viewer':
				return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
		}
	}

	function formatJoinDate(dateString: string) {
		if (!dateString) return 'Recently';
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
					class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600"
				>
					<i class="fas fa-users text-xl text-white"></i>
				</div>
				<div>
					<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
					<p class="text-gray-600 dark:text-gray-400">
						Manage organization members and their roles
					</p>
				</div>
			</div>
			<div class="flex space-x-3">
				<a
					href="/app/org/{data.organization_id}"
					class="flex items-center space-x-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					<i class="fas fa-arrow-left"></i>
					<span>Back to Projects</span>
				</a>
				<button
					on:click={() => (showInviteForm = !showInviteForm)}
					class="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2.5 font-medium text-white transition-all duration-200 hover:from-purple-700 hover:to-pink-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-950"
				>
					<i class="fas {showInviteForm ? 'fa-times' : 'fa-user-plus'}"></i>
					<span>{showInviteForm ? 'Cancel' : 'Invite User'}</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Invite User Form -->
	{#if showInviteForm}
		<div
			class="mb-8 rounded-xl border border-gray-200 bg-white/50 p-6 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/50"
		>
			<div class="mb-4 flex items-center space-x-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30"
				>
					<i class="fas fa-user-plus text-sm text-purple-600 dark:text-purple-400"></i>
				</div>
				<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Invite New User</h2>
			</div>
			<form on:submit|preventDefault={inviteUser} class="space-y-4">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<label
							for="email"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Email Address
						</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
							placeholder="user@example.com"
							required
						/>
					</div>
					<div>
						<label
							for="role"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Role
						</label>
						<select
							id="role"
							bind:value={role}
							class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
						>
							<option value="admin">Admin - Full access</option>
							<option value="editor">Member - Edit projects</option>
							<option value="viewer">Viewer - Read only</option>
						</select>
					</div>
				</div>
				<div class="flex justify-end space-x-3">
					<button
						type="button"
						on:click={() => (showInviteForm = false)}
						class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isInviting || !email || !role}
						class="flex items-center space-x-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isInviting}
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
							></div>
						{:else}
							<i class="fas fa-paper-plane"></i>
						{/if}
						<span>{isInviting ? 'Sending...' : 'Send Invite'}</span>
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Search Bar -->
	{#if (data.organization?.members || []).length > 0}
		<div class="mb-6">
			<div class="relative max-w-md">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search users..."
					class="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-3 pl-10 text-gray-800 placeholder-gray-500 backdrop-blur-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder-gray-400"
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

	<!-- Users List -->
	{#if filteredUsers.length > 0}
		<div
			class="rounded-xl border border-gray-200 bg-white/50 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/50"
		>
			<div class="border-b border-gray-200 p-6 dark:border-gray-700">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
						Organization Members
					</h2>
					<span
						class="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
					>
						{filteredUsers.length}
						{filteredUsers.length === 1 ? 'member' : 'members'}
					</span>
				</div>
			</div>
			<div class="divide-y divide-gray-200 dark:divide-gray-700">
				{#each filteredUsers as member, index}
					<div class="p-6 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-4">
								<!-- Avatar -->
								<div
									class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white"
								>
									{member.user.email.charAt(0).toUpperCase()}
								</div>
								<div>
									<h3 class="font-semibold text-gray-900 dark:text-gray-100">
										{member.user.email}
									</h3>
									<div class="flex items-center space-x-2">
										<span
											class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getRoleColor(
												member.role
											)}"
										>
											<i class="{getRoleIcon(member.role)} mr-1"></i>
											{member.role}
										</span>
										{#if member.user.id === data.organization.owner}
											<span
												class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
											>
												<i class="fas fa-star mr-1"></i>
												Owner
											</span>
										{/if}
									</div>
								</div>
							</div>
							<div class="flex items-center space-x-3">
								{#if member.user.id !== data.organization.owner}
									<button
										class="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
										title="Edit user role"
										aria-label="Edit user role"
									>
										<i class="fas fa-edit"></i>
									</button>
									<button
										on:click={() => removeUser(member.user.id)}
										class="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
										title="Remove user"
										aria-label="Remove user from organization"
									>
										<i class="fas fa-trash"></i>
									</button>
								{:else}
									<span class="text-sm text-gray-500 dark:text-gray-400">Organization Owner</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if searchQuery}
		<!-- No search results -->
		<div class="py-16 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
			>
				<i class="fas fa-search text-2xl text-gray-400"></i>
			</div>
			<h3 class="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">No users found</h3>
			<p class="text-gray-500 dark:text-gray-400">Try adjusting your search query.</p>
		</div>
	{:else}
		<!-- No users yet -->
		<div class="py-16 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30"
			>
				<i class="fas fa-users text-2xl text-purple-600 dark:text-purple-400"></i>
			</div>
			<h3 class="mb-2 text-lg font-medium text-gray-700 dark:text-gray-300">No members yet</h3>
			<p class="mb-6 text-gray-500 dark:text-gray-400">
				Start by inviting users to your organization.
			</p>
			<button
				on:click={() => (showInviteForm = true)}
				class="inline-flex items-center space-x-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
			>
				<i class="fas fa-user-plus"></i>
				<span>Invite First User</span>
			</button>
		</div>
	{/if}
</div>
