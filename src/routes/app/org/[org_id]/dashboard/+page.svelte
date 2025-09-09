<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { api } from '$lib/api';
	import type { DashboardStatistics } from '$lib/api';

	let dashboardData: DashboardStatistics | null = null;
	let loading = true;
	let error: string | null = null;
	let selectedPeriod: '1d' | '1w' | '1m' = '1d';
	let refreshInterval: number | null = null;

	const periods = [
		{ value: '1d', label: '24 Hours' },
		{ value: '1w', label: '7 Days' },
		{ value: '1m', label: '30 Days' }
	];

	// Set to true for development/testing with mock data
	const USE_MOCK_DATA = false;

	const mockData: DashboardStatistics = {
		period: '1d',
		timeRange: {
			start: '2025-08-18T14:16:24.840Z',
			end: '2025-08-19T14:16:24.848Z'
		},
		overview: {
			totalTokensUsed: 25917,
			totalCost: 0.002753,
			totalApiCalls: 15,
			totalConversations: 8,
			totalAgents: 2,
			totalProjects: 1
		},
		promptExecutions: {
			totalCalls: 45,
			totalTokens: 12000,
			totalCost: 0.0012,
			avgTokensPerCall: 267,
			successRate: 95.6,
			breakdown: {
				successful: 43,
				errors: 2,
				cached: 5
			}
		},
		agentExecutions: {
			totalExecutions: 23,
			totalTokens: 13917,
			totalCost: 0.0015,
			totalToolCalls: 8,
			avgExecutionTime: 2840,
			successRate: 87.0,
			breakdown: {
				completed: 20,
				failed: 3,
				pending: 0
			}
		},
		conversations: {
			total: 8,
			totalMessages: 28,
			totalTokens: 25917,
			totalCost: 0.002753,
			totalToolsExecuted: 1,
			avgMessagesPerConversation: '3.50',
			breakdown: {
				active: 8,
				ended: 0
			}
		},
		recentActivity: [],
		topAgents: [],
		dailyUsage: []
	};

	async function fetchDashboardData() {
		loading = true;
		error = null;

		if (USE_MOCK_DATA) {
			// Use mock data for development/testing
			setTimeout(() => {
				dashboardData = mockData;
				loading = false;
			}, 500);
			return;
		}

		try {
			const orgId = $page.params.org_id;
			if (!orgId) {
				throw new Error('Organization ID not found');
			}
			dashboardData = await api.getDashboardStatistics(orgId, selectedPeriod);
			console.log('Dashboard data received:', dashboardData);
			console.log(dashboardData);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
			console.error('Error fetching dashboard data:', err);

			// Provide empty data structure on error
			dashboardData = {
				period: selectedPeriod,
				timeRange: { start: '', end: '' },
				overview: {
					totalTokensUsed: 0,
					totalCost: 0,
					totalApiCalls: 0,
					totalConversations: 0,
					totalAgents: 0,
					totalProjects: 0
				},
				promptExecutions: {
					totalCalls: 0,
					totalTokens: 0,
					totalCost: 0,
					avgTokensPerCall: 0,
					successRate: 0,
					breakdown: { successful: 0, errors: 0, cached: 0 }
				},
				agentExecutions: {
					totalExecutions: 0,
					totalTokens: 0,
					totalCost: 0,
					totalToolCalls: 0,
					avgExecutionTime: 0,
					successRate: 0,
					breakdown: { completed: 0, failed: 0, pending: 0 }
				},
				conversations: {
					total: 0,
					totalMessages: 0,
					totalTokens: 0,
					totalCost: 0,
					totalToolsExecuted: 0,
					avgMessagesPerConversation: '0',
					breakdown: { active: 0, ended: 0 }
				},
				recentActivity: [],
				topAgents: [],
				dailyUsage: []
			};
		} finally {
			loading = false;
		}
	}

	function handlePeriodChange(event: Event) {
		selectedPeriod = (event.target as HTMLSelectElement).value as '1d' | '1w' | '1m';
		fetchDashboardData();
	}

	function formatNumber(num: number | undefined): string {
		if (num === undefined || num === null || isNaN(num)) {
			return '0';
		}
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		} else if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num.toString();
	}

	function formatDuration(ms: number | undefined): string {
		if (ms === undefined || ms === null || isNaN(ms)) {
			return '0ms';
		}
		if (ms < 1000) {
			return `${ms}ms`;
		} else if (ms < 60000) {
			return `${(ms / 1000).toFixed(1)}s`;
		} else {
			return `${(ms / 60000).toFixed(1)}m`;
		}
	}

	// Transform topAgents data to include missing fields
	$: processedTopAgents =
		dashboardData?.topAgents?.map((agent) => {
			// Calculate success rate based on recent activity for this agent
			const agentActivities =
				dashboardData?.recentActivity?.filter(
					(activity) => activity.agent?._id === agent._id || activity.agent?.id === agent._id
				) || [];

			const completedCount = agentActivities.filter(
				(activity) => activity.status === 'completed'
			).length;
			const totalCount = agentActivities.length;
			const successRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

			// Calculate average execution time from recent activities
			const completedActivities = agentActivities.filter(
				(activity) => activity.status === 'completed' && activity.execution_time_ms
			);
			const avgExecutionTime =
				completedActivities.length > 0
					? completedActivities.reduce(
							(sum, activity) => sum + (activity.execution_time_ms || 0),
							0
						) / completedActivities.length
					: 0;

			return {
				...agent,
				executions: agent.totalExecutions,
				successRate: successRate,
				avgExecutionTime: avgExecutionTime
			};
		}) || [];

	// Transform dailyUsage data to match expected field names
	$: processedDailyUsage =
		dashboardData?.dailyUsage?.map((day) => ({
			...day,
			executions: day.executionCount
		})) || [];

	onMount(() => {
		fetchDashboardData();

		// Set up auto-refresh every 60 seconds
		refreshInterval = setInterval(fetchDashboardData, 60000);
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});
</script>

<svelte:head>
	<title>Dashboard - LLM Crafter</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
			<p class="text-gray-600 dark:text-gray-400">
				Overview of your organization's AI agent activity
			</p>
		</div>

		<!-- Period Selector -->
		<div class="flex items-center gap-2">
			<label for="period" class="text-sm font-medium text-gray-700 dark:text-gray-300">
				Time Period:
			</label>
			<select
				id="period"
				bind:value={selectedPeriod}
				on:change={handlePeriodChange}
				class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
			>
				{#each periods as period}
					<option value={period.value}>{period.label}</option>
				{/each}
			</select>
		</div>
	</div>

	{#if loading}
		<!-- Loading State -->
		<div class="flex items-center justify-center py-12">
			<div class="flex items-center space-x-2">
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
				></div>
				<span class="text-gray-600 dark:text-gray-400">Loading dashboard data...</span>
			</div>
		</div>
	{:else if error}
		<!-- Error State -->
		<div
			class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
		>
			<div class="flex">
				<div class="flex-shrink-0">
					<i class="fas fa-exclamation-triangle text-red-400"></i>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800 dark:text-red-200">
						Error loading dashboard
					</h3>
					<div class="mt-2 text-sm text-red-700 dark:text-red-300">
						{error}
					</div>
					<div class="mt-4">
						<button
							on:click={fetchDashboardData}
							class="rounded-md bg-red-100 px-2 py-1 text-sm font-medium text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700"
						>
							Try again
						</button>
					</div>
				</div>
			</div>
		</div>
	{:else if dashboardData}
		<!-- Overview Cards -->
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Total Conversations -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="rounded-md bg-blue-500 p-3">
							<i class="fas fa-comments text-white"></i>
						</div>
					</div>
					<div class="ml-5 w-0 flex-1">
						<dl>
							<dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
								Total Conversations
							</dt>
							<dd class="text-lg font-medium text-gray-900 dark:text-white">
								{formatNumber(dashboardData?.conversations?.total)}
							</dd>
						</dl>
					</div>
				</div>
			</div>

			<!-- Total Messages -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="rounded-md bg-green-500 p-3">
							<i class="fas fa-comment text-white"></i>
						</div>
					</div>
					<div class="ml-5 w-0 flex-1">
						<dl>
							<dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
								Total Messages
							</dt>
							<dd class="text-lg font-medium text-gray-900 dark:text-white">
								{formatNumber(dashboardData?.conversations?.totalMessages)}
							</dd>
						</dl>
					</div>
				</div>
			</div>

			<!-- Total Cost -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="rounded-md bg-purple-500 p-3">
							<i class="fas fa-dollar-sign text-white"></i>
						</div>
					</div>
					<div class="ml-5 w-0 flex-1">
						<dl>
							<dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
								Total Cost
							</dt>
							<dd class="text-lg font-medium text-gray-900 dark:text-white">
								${(dashboardData?.conversations?.totalCost ?? 0).toFixed(4)}
							</dd>
						</dl>
					</div>
				</div>
			</div>

			<!-- Total Agents -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="rounded-md bg-orange-500 p-3">
							<i class="fas fa-robot text-white"></i>
						</div>
					</div>
					<div class="ml-5 w-0 flex-1">
						<dl>
							<dt class="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
								Total Agents
							</dt>
							<dd class="text-lg font-medium text-gray-900 dark:text-white">
								{formatNumber(dashboardData?.overview?.totalAgents)}
							</dd>
						</dl>
					</div>
				</div>
			</div>
		</div>

		<!-- Charts Section -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Daily Usage Chart -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">Daily Usage</h3>
				<div class="space-y-2">
					{#each processedDailyUsage as day}
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600 dark:text-gray-400">
								{new Date(day._id).toLocaleDateString()}
							</span>
							<div class="flex items-center space-x-4">
								<div class="flex items-center space-x-2">
									<div class="h-3 w-3 rounded-full bg-blue-500"></div>
									<span class="text-sm text-gray-600 dark:text-gray-400">{day.executions}</span>
								</div>
								<div class="h-2 w-24 rounded-full bg-gray-200 dark:bg-gray-700">
									<div
										class="h-2 rounded-full bg-blue-500"
										style="width: {Math.min(
											100,
											processedDailyUsage?.length
												? (day.tokenCount /
														Math.max(...processedDailyUsage.map((d) => d.tokenCount))) *
														100
												: 0
										)}%"
									></div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Top Agents -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">
					Top Performing Agents
				</h3>
				<div class="space-y-4">
					{#each processedTopAgents as agent, index}
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-3">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
								>
									{index + 1}
								</div>
								<div>
									<p class="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</p>
									<p class="text-xs text-gray-500 dark:text-gray-400">
										{agent.executions} executions
									</p>
								</div>
							</div>
							<div class="text-right">
								<p class="text-sm font-medium text-gray-900 dark:text-white">
									{agent.successRate?.toFixed(1) || '0.0'}%
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									{formatDuration(agent.avgExecutionTime)}
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Recent Activity -->
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
			<div class="space-y-3">
				{#each dashboardData?.recentActivity || [] as execution}
					<div
						class="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0 dark:border-gray-700"
					>
						<div class="flex items-center space-x-3">
							<div class="flex-shrink-0">
								{#if execution.status === 'success'}
									<div class="h-2 w-2 rounded-full bg-green-500"></div>
								{:else if execution.status === 'failed'}
									<div class="h-2 w-2 rounded-full bg-red-500"></div>
								{:else}
									<div class="h-2 w-2 rounded-full bg-yellow-500"></div>
								{/if}
							</div>
							<div>
								<p class="text-sm font-medium text-gray-900 dark:text-white">
									{execution.agentName}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									{new Date(execution.timestamp).toLocaleString()}
								</p>
							</div>
						</div>
						<div class="text-right">
							<p class="text-sm font-medium capitalize text-gray-900 dark:text-white">
								{execution.status}
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								{formatDuration(execution.executionTime)}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
