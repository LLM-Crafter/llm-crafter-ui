<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { api } from '$lib/api';

	export let data; // Contains user and organizations data
	const dispatch = createEventDispatcher();

	let firstName = data.user?.firstName || '';
	let lastName = data.user?.lastName || '';
	let password = '';
	let loading = false;
	let error = '';
	let success = '';

	// Extract first and last name from the full name if they don't exist separately
	if (!firstName && !lastName && data.user?.name) {
		const nameParts = data.user.name.split(' ');
		firstName = nameParts[0] || '';
		lastName = nameParts.slice(1).join(' ') || '';
	}

	async function updateProfile() {
		loading = true;
		error = '';
		success = '';

		try {
			const profileData = {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				name: `${firstName.trim()} ${lastName.trim()}`.trim(),
				password: password
			};

			await api.updateProfile(profileData);

			success = 'Profile updated successfully!';

			// Clear password field after successful update
			password = '';

			// Update the user data in the parent component
			setTimeout(() => {
				dispatch('updated', {
					firstName: profileData.firstName,
					lastName: profileData.lastName,
					name: profileData.name
				});
			}, 1000);
		} catch (err) {
			error = (err as Error).message || 'Something went wrong';
		} finally {
			loading = false;
		}
	}

	function closeModal() {
		// Clear sensitive data when closing
		password = '';
		error = '';
		success = '';
		dispatch('close');
	}
</script>

<!-- BACKDROP -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
	<!-- MODAL -->
	<div class="w-full max-w-lg rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-xl">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-bold text-white">Profile Settings</h2>
			<button
				on:click={closeModal}
				class="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-100"
				aria-label="Close"
			>
				<i class="fas fa-times"></i>
			</button>
		</div>

		{#if error}
			<div class="mb-4 rounded-lg border border-red-800 bg-red-900/50 p-3 text-red-300">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="mb-4 rounded-lg border border-green-800 bg-green-900/50 p-3 text-green-300">
				{success}
			</div>
		{/if}

		<!-- Profile Picture -->
		<div class="mb-6 flex justify-center">
			<img
				src={`https://ui-avatars.com/api/?name=${firstName} ${lastName}&bold=true&size=96`}
				alt="Profile Avatar"
				class="h-24 w-24 rounded-full border-2 border-gray-700"
			/>
		</div>

		<form on:submit|preventDefault={updateProfile}>
			<div class="mb-4">
				<label class="mb-1 block text-sm text-gray-300" for="firstName">First Name</label>
				<input
					id="firstName"
					type="text"
					bind:value={firstName}
					required
					disabled={loading}
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
					placeholder="Enter your first name"
				/>
			</div>

			<div class="mb-6">
				<label class="mb-1 block text-sm text-gray-300" for="lastName">Last Name</label>
				<input
					id="lastName"
					type="text"
					bind:value={lastName}
					required
					disabled={loading}
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
					placeholder="Enter your last name"
				/>
			</div>

			<!-- Password Verification -->
			<div class="mb-6">
				<label class="mb-1 block text-sm text-gray-300" for="password">Current Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					disabled={loading}
					class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
					placeholder="Enter your current password to confirm changes"
				/>
				<p class="mt-1 text-xs text-gray-400">Required to update your profile information</p>
			</div>

			<!-- Organizations Section -->
			<div class="mb-6">
				<h3 class="mb-3 text-lg font-semibold text-gray-100">Organizations</h3>
				{#if data.organizations && data.organizations.length > 0}
					<div class="space-y-2">
						{#each data.organizations as org}
							<div
								class="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-3"
							>
								<div class="flex items-center space-x-3">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white"
									>
										{org.name.charAt(0).toUpperCase()}
									</div>
									<div>
										<p class="text-sm font-medium text-gray-100">{org.name}</p>
										{#if org.description}
											<p class="text-xs text-gray-400">{org.description}</p>
										{/if}
									</div>
								</div>
								<span class="rounded-full bg-gray-700 px-2 py-1 text-xs text-gray-300">
									Member
								</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-400">You are not a member of any organizations.</p>
				{/if}
			</div>

			<!-- Action Buttons -->
			<div class="flex justify-end space-x-3">
				<button
					type="button"
					on:click={closeModal}
					disabled={loading}
					class="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={loading || !firstName.trim() || !lastName.trim() || !password.trim()}
					class="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{#if loading}
						<i class="fas fa-spinner fa-spin mr-2"></i>
					{/if}
					Save Changes
				</button>
			</div>
		</form>
	</div>
</div>
