<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/api.js';

	export let data;

	let email = '';
	let role = '';

	async function inviteUser() {
		let response = await api.inviteUserToOrg(data.organization_id, email, role);

		if (response) {
			email = '';
			role = '';
			invalidateAll();
		}
	}

	async function removeUser(user_id: string) {
		let response = await api.deleteUserFromOrg(data.organization_id, user_id);
		if (response) {
			invalidateAll();
		}
	}
</script>

<header class="mb-8 flex items-center justify-between">
	<h1 class="text-2xl font-semibold text-white">User Management</h1>
	<a
		href="/app/org/{data.organization_id}"
		class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
		>Back to Projects</a
	>
</header>

<!-- Add User Form -->
<div class="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-6 text-white shadow-lg">
	<h2 class="mb-4 text-lg font-semibold">Add New User</h2>
	<div id="add-user-form" class="flex flex-col space-y-4">
		<input
			type="email"
			bind:value={email}
			class="w-full rounded-lg border border-gray-700 bg-gray-800 p-4 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
			placeholder="Enter user email"
			required
		/>
		<select
			id="new-user-role"
			bind:value={role}
			class="w-full rounded-lg border border-gray-700 bg-gray-800 p-4 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			<option value="admin">Admin</option>
			<option value="editor">Member</option>
			<option value="viewer">Viewer</option>
		</select>
		<button
			type="submit"
			on:click={inviteUser}
			class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
			>Add User</button
		>
	</div>
</div>

<!-- User List -->
<div class="rounded-lg border border-gray-800 bg-gray-900 p-6 text-white shadow-lg">
	<h2 class="mb-4 text-lg font-semibold">Organization Users</h2>
	<table class="w-full border-collapse text-left">
		<thead>
			<tr>
				<th class="border-b border-gray-800 p-3">Email</th>
				<th class="border-b border-gray-800 p-3">Role</th>
				<th class="border-b border-gray-800 p-3">Actions</th>
			</tr>
		</thead>
		<tbody id="user-list">
			<!-- Example User Row -->
			{#each data.organization.members as u (u.user.id)}
				<tr>
					<td class="border-b border-gray-800 p-3">{u.user.email}</td>
					<td class="border-b border-gray-800 p-3">{u.role}</td>
					<td class="border-b border-gray-800 p-3">
						{#if u.user.id != data.organization.owner}
							<button
								class="mr-2 rounded-lg bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
								>Edit</button
							>
							<button
								on:click={() => removeUser(u.user.id)}
								class="rounded-lg bg-red-600 px-3 py-1 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
								>Remove</button
							>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
