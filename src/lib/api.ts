import { get } from 'svelte/store';
import { token } from './stores/auth';
import { goto } from '$app/navigation';
import { PUBLIC_API_URL } from '$env/static/public';

const API_URL = PUBLIC_API_URL;

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

export interface PromptCreateDTO {
	name?: string;
}

export interface PromptUpdateDTO {
	api_key?: string;
	description?: string;
	content?: string;
	llm_settings?: LLMSettings;
}

export interface CreateOrganizationDTO {
	name: string;
	description?: string;
}

export interface LLMSettings {
	model?: string;
	parameters?: {
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

export interface TestPromptParameters {
	content: string;
	llm_settings: {
		model: string;
		parameters?: { [key: string]: any };
	};
	api_key_id: string;
	variables?: {
		[key: string]: any;
	};
}

class ApiClient {
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

	async getProfile() {
		const response = await this.fetch('/auth/profile');
		if (!response.ok) throw new Error('Failed to get profile');
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
		data: PromptCreateDTO
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
}

export const api = new ApiClient();
