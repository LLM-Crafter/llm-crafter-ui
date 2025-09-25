import { get } from 'svelte/store';
import { token } from './stores/auth';
import { goto } from '$app/navigation';
import { env } from '$env/dynamic/public';

const API_URL = env.PUBLIC_API_URL;

export interface Organization {
	_id: string;
	name: string;
	description?: string;
	owner: string;
}

interface Provider {
	_id: string;
	name: string;
	models: string[];
	createdAt?: Date;
	updatedAt?: Date;
}

interface LLMConfiguration {
	provider: string;
	api_key: string;
	model?: string;
	default_parameters?: Map<string, any>;
}

interface Project {
	_id: string;
	name: string;
	description?: string;
	organization: string;
	llm_configurations: LLMConfiguration[];
	createdAt?: Date;
	updatedAt?: Date;
}

export interface ApiKeyDTO {
	name?: string;
	key?: string;
	provider?: string;
}

export interface UserApiKeyCreateDTO {
	name: string;
	scopes: string[];
	restrictions?: {
		ip_whitelist?: string[];
		domain_whitelist?: string[];
		rate_limit_override?: number;
		max_executions_per_day?: number;
	};
	expires_at?: string;
	allowed_projects?: string[];
}

export interface UserApiKeyUpdateDTO {
	name?: string;
	scopes?: string[];
	restrictions?: {
		ip_whitelist?: string[];
		domain_whitelist?: string[];
		rate_limit_override?: number;
		max_executions_per_day?: number;
	};
	expires_at?: string;
	allowed_projects?: string[];
}

export interface UserApiKey {
	_id: string;
	name: string;
	api_key?: string; // Only returned on creation
	scopes: string[];
	restrictions?: {
		ip_whitelist?: string[];
		domain_whitelist?: string[];
		rate_limit_override?: number;
		max_executions_per_day?: number;
	};
	expires_at?: string | null;
	allowed_projects?: string[];
	is_active: boolean;
	createdAt: string;
	updatedAt: string;
	usage?: {
		total_requests: number;
		executions_today: number;
		last_used_at?: string;
		last_reset_date?: string;
	};
	is_expired: boolean | null;
	masked_key: string;
	user: string;
	organization: string;
	created_by: string;
	__v?: number;
	id?: string; // Might be added by Mongoose
}

export interface PromptCreateDTO {
	name?: string;
}

export interface PromptUpdateDTO {
	api_key?: string;
	description?: string;
	content?: string;
	system_prompt?: string;
	llm_settings: LLMSettings;
}

export interface CreateOrganizationDTO {
	name: string;
	description?: string;
}

export interface LLMSettings {
	model?: string;
	parameters: {
		temperature?: number;
		max_tokens?: number;
		top_p?: number;
		frequency_penalty?: number;
		presence_penalty?: number;
	};
}

export interface Prompt {
	_id: string;
	name: string;
	description?: string;
	content?: string;
	system_prompt?: string;
	project: string;
	version?: number;
	api_key?: string;
	llm_settings?: LLMSettings;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface ExecutePromptParameters {
	variables: {
		[key: string]: any;
	};
}

export interface OAuthProvider {
	name: string;
	displayName: string;
	authUrl: string;
}

export interface OAuthProvidersResponse {
	success: boolean;
	data: {
		providers: OAuthProvider[];
		domainRestricted: boolean;
		allowedDomains: string[];
	};
}

export interface TestPromptParameters {
	content: string;
	system_prompt?: string;
	llm_settings: {
		model: string;
		parameters?: { [key: string]: any };
	};
	api_key_id: string;
	variables?: {
		[key: string]: any;
	};
}

export interface DashboardStatistics {
	period: string;
	timeRange: {
		start: string;
		end: string;
	};
	overview: {
		totalTokensUsed: number;
		totalCost: number;
		totalApiCalls: number;
		totalConversations: number;
		totalAgents: number;
		totalProjects: number;
	};
	promptExecutions: {
		totalCalls: number;
		totalTokens: number;
		totalCost: number;
		avgTokensPerCall: number;
		successRate: number;
		breakdown: {
			successful: number;
			errors: number;
			cached: number;
		};
	};
	agentExecutions: {
		totalExecutions: number;
		totalTokens: number;
		totalCost: number;
		totalToolCalls: number;
		avgExecutionTime: number;
		successRate: number;
		breakdown: {
			completed: number;
			failed: number;
			pending: number;
		};
	};
	conversations: {
		total: number;
		totalMessages: number;
		totalTokens: number;
		totalCost: number;
		totalToolsExecuted: number;
		avgMessagesPerConversation: string;
		breakdown: {
			active: number;
			ended: number;
		};
	};
	recentActivity: Array<any>;
	topAgents: Array<any>;
	dailyUsage: Array<any>;
}

export interface AgentStatistics {
	overview: {
		totalExecutions: number;
		successfulExecutions: number;
		failedExecutions: number;
		successRate: number;
		averageExecutionTime: number;
	};
	dailyUsage: Array<{
		date: string;
		executions: number;
		successfulExecutions: number;
		failedExecutions: number;
		averageExecutionTime: number;
	}>;
	recentExecutions: Array<{
		status: 'success' | 'failed' | 'pending';
		timestamp: string;
		executionTime: number;
		input?: string;
		output?: string;
		errorMessage?: string;
	}>;
}

class ApiClient {
	getApiUrl(): string {
		return API_URL;
	}

	async fetch(endpoint: string, options: RequestInit = {}) {
		const authToken = get(token);

		const response = await fetch(`${API_URL}${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...(authToken && { Authorization: `Bearer ${authToken}` }),
				...options.headers
			}
		});

		if (response.status === 401) {
			token.set(null);
			goto('/login');
			throw new Error('Unauthorized');
		}

		if (response.status === 403) {
			goto('/app');
			throw new Error('Unauthorized');
		}

		return response;
	}

	async login(email: string, password: string) {
		const response = await this.fetch('/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email, password })
		});

		if (!response.ok) throw new Error('Invalid credentials');

		const data = await response.json();
		return data.token;
	}

	async getOAuthProviders(): Promise<OAuthProvidersResponse> {
		const response = await fetch(`${API_URL}/auth/oauth/providers`);
		if (!response.ok) throw new Error('Failed to fetch OAuth providers');
		return response.json();
	}

	getGoogleOAuthUrl(): string {
		return `${API_URL}/api/v1/auth/google`;
	}

	getGitHubOAuthUrl(): string {
		return `${API_URL}/api/v1/auth/github`;
	}

	async getProfile() {
		const response = await this.fetch('/auth/profile');
		if (!response.ok) throw new Error('Failed to get profile');
		return response.json();
	}

	async updateProfile(profileData: {
		firstName?: string;
		lastName?: string;
		name?: string;
		password: string;
	}) {
		const response = await this.fetch('/auth/profile', {
			method: 'PUT',
			body: JSON.stringify(profileData)
		});
		if (!response.ok) throw new Error('Failed to update profile');
		return response.json();
	}

	async getUserOrganizations(): Promise<Organization[]> {
		const response = await this.fetch('/organizations');
		if (!response.ok) throw new Error('Failed to fetch organizations');
		return response.json();
	}

	async getOrganization(org_id: string): Promise<Organization> {
		const response = await this.fetch('/organizations/' + org_id);
		if (!response.ok) throw new Error('Failed to fetch organizations');
		return response.json();
	}

	async createOrganization(data: CreateOrganizationDTO): Promise<Organization> {
		const response = await this.fetch('/organizations', {
			method: 'POST',
			body: JSON.stringify(data)
		});

		if (!response.ok) throw new Error('Failed to create organization');
		return response.json();
	}

	async getOrganizationProjects(org_id: string): Promise<Project[]> {
		const response = await this.fetch('/organizations/' + org_id + '/projects');
		if (!response.ok) throw new Error('Failed to fetch projects');
		return response.json();
	}

	async getProject(org_id: string, project_id: string): Promise<Project> {
		const response = await this.fetch('/organizations/' + org_id + '/projects/' + project_id);
		if (!response.ok) throw new Error('Failed to fetch project');
		return response.json();
	}

	async createProject(org_id: string, name: string, description?: string): Promise<Project> {
		const response = await this.fetch(`/organizations/${org_id}/projects`, {
			method: 'POST',
			body: JSON.stringify({
				name,
				description
			})
		});

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			throw new Error(err.message || 'Failed to create project');
		}

		return response.json();
	}

	async getProviders(): Promise<Provider[]> {
		const response = await this.fetch('/providers');
		if (!response.ok) throw new Error('Failed to fetch providers');
		return response.json();
	}

	async createApiKey(org_id: string, project_id: string, data: ApiKeyDTO): Promise<ApiKeyDTO> {
		const response = await this.fetch(
			'/organizations/' + org_id + '/projects/' + project_id + '/api-keys',
			{
				method: 'POST',
				body: JSON.stringify(data)
			}
		);

		if (!response.ok) throw new Error('Failed to create api key');
		return response.json();
	}

	async deleteApiKey(org_id: string, project_id: string, apiKeyId: string): Promise<{}> {
		const response = await this.fetch(
			'/organizations/' + org_id + '/projects/' + project_id + '/api-keys/' + apiKeyId,
			{
				method: 'DELETE'
			}
		);

		if (!response.ok) throw new Error('Failed to delete api key');
		return response.json();
	}

	async getPrompt(org_id: string, project_id: string, prompt_id: string): Promise<Prompt> {
		const response = await this.fetch(
			'/organizations/' + org_id + '/projects/' + project_id + '/prompts/' + prompt_id,
			{
				method: 'GET'
			}
		);

		if (!response.ok) throw new Error('Failed to get prompt');
		return response.json();
	}

	async createPrompt(org_id: string, project_id: string, data: PromptCreateDTO): Promise<{}> {
		const response = await this.fetch(
			'/organizations/' + org_id + '/projects/' + project_id + '/prompts',
			{
				method: 'POST',
				body: JSON.stringify(data)
			}
		);

		if (!response.ok) throw new Error('Failed to create api key');
		return response.json();
	}

	async updatePrompt(
		org_id: string,
		project_id: string,
		promptId: string,
		data: PromptUpdateDTO
	): Promise<{}> {
		const response = await this.fetch(
			'/organizations/' + org_id + '/projects/' + project_id + '/prompts/' + promptId,
			{
				method: 'PUT',
				body: JSON.stringify(data)
			}
		);

		if (!response.ok) throw new Error('Failed to update prompt');
		return response.json();
	}

	async deletePrompt(org_id: string, project_id: string, promptId: string): Promise<{}> {
		const response = await this.fetch(
			'/organizations/' + org_id + '/projects/' + project_id + '/prompts/' + promptId,
			{
				method: 'DELETE'
			}
		);

		if (!response.ok) throw new Error('Failed to delete prompt');
		return response.json();
	}

	async executePrompt(
		org_id: string,
		project_id: string,
		promptName: string,
		parameters: ExecutePromptParameters
	): Promise<{}> {
		const response = await this.fetch(
			'/proxy/organizations/' + org_id + '/projects/' + project_id + '/execute/' + promptName,
			{
				method: 'POST',
				body: JSON.stringify(parameters)
			}
		);

		if (!response.ok) throw new Error('Failed to execute prompt');
		return response.json();
	}

	async testPrompt(parameters: TestPromptParameters): Promise<{}> {
		const response = await this.fetch('/proxy/test-prompt/', {
			method: 'POST',
			body: JSON.stringify(parameters)
		});

		if (!response.ok) throw new Error('Failed to execute prompt');
		return response.json();
	}

	async getPromptExecutions(
		org_id: string,
		project_id: string,
		prompt_id: string,
		page: number = 1
	): Promise<{}> {
		const response = await this.fetch(
			'/proxy/organizations/' +
				org_id +
				'/projects/' +
				project_id +
				'/prompts/' +
				prompt_id +
				'/executions?page=' +
				page,
			{
				method: 'GET'
			}
		);

		if (!response.ok) throw new Error('Failed to get prompt executions');
		return response.json();
	}

	async inviteUserToOrg(
		orgId: string,
		email: string,
		role: 'admin' | 'member' | 'viewer'
	): Promise<{}> {
		const response = await this.fetch(`/organizations/${orgId}/members`, {
			method: 'POST',
			body: JSON.stringify({ email, role })
		});

		if (!response.ok) throw new Error('Failed to invite user to organization');
		return response.json();
	}

	async deleteUserFromOrg(orgId: string, user_id: string): Promise<{}> {
		const response = await this.fetch(`/organizations/${orgId}/members/${user_id}`, {
			method: 'Delete'
		});

		if (!response.ok) throw new Error('Failed to delete user to organization');
		return response.json();
	}

	async updateMemberRole(
		orgId: string,
		userId: string,
		role: 'admin' | 'member' | 'viewer'
	): Promise<{}> {
		const response = await this.fetch(`/organizations/${orgId}/members/${userId}`, {
			method: 'PUT',
			body: JSON.stringify({ role })
		});

		if (!response.ok) throw new Error('Failed to update member role');
		return response.json();
	}

	// Agent management methods
	async getAgents(orgId: string, projectId: string) {
		const response = await this.fetch(`/organizations/${orgId}/projects/${projectId}/agents`);
		if (!response.ok) throw new Error('Failed to fetch agents');
		return response.json();
	}

	async getAgent(orgId: string, projectId: string, agentId: string) {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/agents/${agentId}`
		);
		if (!response.ok) throw new Error('Failed to fetch agent');
		return response.json();
	}

	async createAgent(orgId: string, projectId: string, agentData: any) {
		const response = await this.fetch(`/organizations/${orgId}/projects/${projectId}/agents`, {
			method: 'POST',
			body: JSON.stringify(agentData)
		});
		if (!response.ok) throw new Error('Failed to create agent');
		return response.json();
	}

	async updateAgent(orgId: string, projectId: string, agentId: string, agentData: any) {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/agents/${agentId}`,
			{
				method: 'PUT',
				body: JSON.stringify(agentData)
			}
		);
		if (!response.ok) throw new Error('Failed to update agent');
		return response.json();
	}

	async deleteAgent(orgId: string, projectId: string, agentId: string) {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/agents/${agentId}`,
			{
				method: 'DELETE'
			}
		);
		if (!response.ok) throw new Error('Failed to delete agent');
		return response.json();
	}

	async executeAgent(orgId: string, projectId: string, agentId: string, executionData: any) {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/agents/${agentId}/execute`,
			{
				method: 'POST',
				body: JSON.stringify(executionData)
			}
		);
		if (!response.ok) throw new Error('Failed to execute agent');
		return response.json();
	}

	async chatWithAgent(orgId: string, projectId: string, agentId: string, chatData: any) {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/agents/${agentId}/chat`,
			{
				method: 'POST',
				body: JSON.stringify(chatData)
			}
		);
		if (!response.ok) throw new Error('Failed to chat with agent');
		return response.json();
	}

	async chatWithAgentStream(orgId: string, projectId: string, agentId: string, chatData: any) {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/agents/${agentId}/chat/stream`,
			{
				method: 'POST',
				body: JSON.stringify(chatData)
			}
		);
		if (!response.ok) throw new Error('Failed to start streaming chat with agent');
		return response;
	}

	async executeTaskAgentStream(orgId: string, projectId: string, agentId: string, executionData: any) {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/agents/${agentId}/execute/stream`,
			{
				method: 'POST',
				body: JSON.stringify(executionData)
			}
		);
		if (!response.ok) throw new Error('Failed to start streaming task execution');
		return response;
	}

	async getAgentConversations(orgId: string, projectId: string, agentId: string) {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/agents/${agentId}/conversations`
		);
		if (!response.ok) throw new Error('Failed to fetch conversations');
		return response.json();
	}

	async getAgentExecutions(orgId: string, projectId: string, agentId: string) {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/agents/${agentId}/executions`
		);
		if (!response.ok) throw new Error('Failed to fetch executions');
		return response.json();
	}

	// API Endpoint Configuration Methods
	async getAgentApiConfig(orgId: string, projectId: string, agentId: string) {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/agents/${agentId}/api-config`
		);
		if (!response.ok) throw new Error('Failed to fetch API configuration');
		return response.json();
	}

	async configureAgentApiEndpoints(
		orgId: string,
		projectId: string,
		agentId: string,
		configData: any
	) {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/agents/${agentId}/api-config`,
			{
				method: 'POST',
				body: JSON.stringify(configData)
			}
		);
		if (!response.ok) throw new Error('Failed to configure API endpoints');
		return response.json();
	}

	async register(name: string, email: string, password: string) {
		const response = await this.fetch('/auth/register', {
			method: 'POST',
			body: JSON.stringify({ name, email, password })
		});

		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			throw new Error(err.message || 'Registration failed');
		}

		const data = await response.json();
		return data.token; // assuming API returns { token: '...' }
	}

	async getDashboardStatistics(
		orgId: string,
		period: '1d' | '1w' | '1m' = '1d'
	): Promise<DashboardStatistics> {
		const response = await this.fetch(
			`/organizations/${orgId}/statistics/dashboard?period=${period}`
		);

		if (!response.ok) {
			if (response.status === 401) {
				token.set(null);
				goto('/login');
				throw new Error('Authentication failed');
			}
			throw new Error(`Failed to fetch dashboard statistics: ${response.statusText}`);
		}

		return await response.json();
	}

	async getAgentStatistics(
		orgId: string,
		agentId: string,
		period: '1d' | '1w' | '1m' = '1d'
	): Promise<AgentStatistics> {
		const response = await this.fetch(
			`/organizations/${orgId}/statistics/agents/${agentId}?period=${period}`
		);

		if (!response.ok) {
			if (response.status === 401) {
				token.set(null);
				goto('/login');
				throw new Error('Authentication failed');
			}
			throw new Error(`Failed to fetch agent statistics: ${response.statusText}`);
		}

		return await response.json();
	}

	// User API Key Management Methods
	async createUserApiKey(orgId: string, data: UserApiKeyCreateDTO): Promise<UserApiKey> {
		const response = await this.fetch(`/organizations/${orgId}/user-api-keys`, {
			method: 'POST',
			body: JSON.stringify(data)
		});

		if (!response.ok) throw new Error('Failed to create user API key');
		const result = await response.json();
		return result.data;
	}

	async getUserApiKeys(orgId: string): Promise<UserApiKey[]> {
		const response = await this.fetch(`/organizations/${orgId}/user-api-keys`);
		if (!response.ok) throw new Error('Failed to fetch user API keys');
		const result = await response.json();
		return result.data;
	}

	async getUserApiKey(orgId: string, keyId: string): Promise<UserApiKey> {
		const response = await this.fetch(`/organizations/${orgId}/user-api-keys/${keyId}`);
		if (!response.ok) throw new Error('Failed to fetch user API key');
		const result = await response.json();
		return result.data;
	}

	async updateUserApiKey(
		orgId: string,
		keyId: string,
		data: UserApiKeyUpdateDTO
	): Promise<UserApiKey> {
		const response = await this.fetch(`/organizations/${orgId}/user-api-keys/${keyId}`, {
			method: 'PUT',
			body: JSON.stringify(data)
		});

		if (!response.ok) throw new Error('Failed to update user API key');
		const result = await response.json();
		return result.data;
	}

	async rotateUserApiKey(orgId: string, keyId: string): Promise<UserApiKey> {
		const response = await this.fetch(`/organizations/${orgId}/user-api-keys/${keyId}/rotate`, {
			method: 'POST'
		});

		if (!response.ok) throw new Error('Failed to rotate user API key');
		const result = await response.json();
		return result.data;
	}

	async revokeUserApiKey(orgId: string, keyId: string): Promise<void> {
		const response = await this.fetch(`/organizations/${orgId}/user-api-keys/${keyId}`, {
			method: 'DELETE'
		});

		if (!response.ok) throw new Error('Failed to revoke user API key');
	}

	async getUserApiKeyUsage(orgId: string, keyId: string): Promise<any> {
		const response = await this.fetch(`/organizations/${orgId}/user-api-keys/${keyId}/usage`);
		if (!response.ok) throw new Error('Failed to fetch user API key usage');
		const result = await response.json();
		return result.data;
	}

	// RAG (Retrieval-Augmented Generation) Methods
	async indexDocuments(
		orgId: string,
		projectId: string,
		documentsData: any,
		processInBackground: boolean = true
	): Promise<any> {
		const payload = {
			...documentsData,
			process_in_background: processInBackground
		};

		const response = await this.fetch(`/organizations/${orgId}/projects/${projectId}/rag/index`, {
			method: 'POST',
			body: JSON.stringify(payload)
		});

		if (!response.ok) throw new Error('Failed to index documents');
		return response.json();
	}

	async searchDocuments(orgId: string, projectId: string, searchData: any): Promise<any> {
		const response = await this.fetch(`/organizations/${orgId}/projects/${projectId}/rag/search`, {
			method: 'POST',
			body: JSON.stringify(searchData)
		});

		if (!response.ok) throw new Error('Failed to search documents');
		return response.json();
	}

	async getRagStats(orgId: string, projectId: string): Promise<any> {
		const response = await this.fetch(`/organizations/${orgId}/projects/${projectId}/rag/stats`);

		if (!response.ok) throw new Error('Failed to fetch RAG statistics');
		return response.json();
	}

	async clearRagKnowledgeBase(orgId: string, projectId: string): Promise<any> {
		const response = await this.fetch(`/organizations/${orgId}/projects/${projectId}/rag/clear`, {
			method: 'DELETE'
		});

		if (!response.ok) throw new Error('Failed to clear knowledge base');
		return response.json();
	}

	async batchIndexDocuments(
		orgId: string,
		projectId: string,
		batchData: any,
		processInBackground: boolean = true
	): Promise<any> {
		const payload = {
			...batchData,
			process_in_background: processInBackground
		};

		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/rag/batch-index`,
			{
				method: 'POST',
				body: JSON.stringify(payload)
			}
		);

		if (!response.ok) throw new Error('Failed to batch index documents');
		return response.json();
	}

	// Background Job Management Methods
	async getJobStatus(orgId: string, projectId: string, jobId: string): Promise<any> {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/rag/jobs/${jobId}`
		);

		if (!response.ok) throw new Error('Failed to fetch job status');
		return response.json();
	}

	async listJobs(orgId: string, projectId: string, limit: number = 50): Promise<any> {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/rag/jobs?limit=${limit}`
		);

		if (!response.ok) throw new Error('Failed to fetch jobs list');
		return response.json();
	}

	async getJobStats(orgId: string, projectId: string): Promise<any> {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/rag/jobs/stats`
		);

		if (!response.ok) throw new Error('Failed to fetch job statistics');
		return response.json();
	}

	async cancelJob(orgId: string, projectId: string, jobId: string): Promise<any> {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/rag/jobs/${jobId}`,
			{
				method: 'DELETE'
			}
		);

		if (!response.ok) throw new Error('Failed to cancel job');
		return response.json();
	}

	// Vector Database Configuration Methods
	async getSupportedVectorDbProviders(): Promise<any> {
		const response = await this.fetch('/vector-databases/providers');

		if (!response.ok) throw new Error('Failed to fetch supported vector database providers');
		return response.json();
	}

	async createVectorDbConfig(orgId: string, projectId: string, configData: any): Promise<any> {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/vector-databases`,
			{
				method: 'POST',
				body: JSON.stringify(configData)
			}
		);

		if (!response.ok) throw new Error('Failed to create vector database configuration');
		return response.json();
	}

	async getVectorDbConfigs(orgId: string, projectId: string): Promise<any> {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/vector-databases`
		);

		if (!response.ok) throw new Error('Failed to fetch vector database configurations');
		return response.json();
	}

	async updateVectorDbConfig(
		orgId: string,
		projectId: string,
		configId: string,
		configData: any
	): Promise<any> {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/vector-databases/${configId}`,
			{
				method: 'PUT',
				body: JSON.stringify(configData)
			}
		);

		if (!response.ok) throw new Error('Failed to update vector database configuration');
		return response.json();
	}

	async deleteVectorDbConfig(orgId: string, projectId: string, configId: string): Promise<any> {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/vector-databases/${configId}`,
			{
				method: 'DELETE'
			}
		);

		if (!response.ok) throw new Error('Failed to delete vector database configuration');
		return response.json();
	}

	async testVectorDbConnection(orgId: string, projectId: string, configId: string): Promise<any> {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/vector-databases/${configId}/test`,
			{
				method: 'POST'
			}
		);

		if (!response.ok) throw new Error('Failed to test vector database connection');
		return response.json();
	}

	async setDefaultVectorDbConfig(orgId: string, projectId: string, configId: string): Promise<any> {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/vector-databases/${configId}/default`,
			{
				method: 'PUT'
			}
		);

		if (!response.ok) throw new Error('Failed to set default vector database configuration');
		return response.json();
	}

	async getVectorDbConfigStats(orgId: string, projectId: string, configId: string): Promise<any> {
		const response = await this.fetch(
			`/organizations/${orgId}/projects/${projectId}/vector-databases/${configId}/stats`
		);

		if (!response.ok) throw new Error('Failed to fetch vector database configuration stats');
		return response.json();
	}
}

export const api = new ApiClient();
