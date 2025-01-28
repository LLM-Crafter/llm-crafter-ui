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

export interface CreateOrganizationDTO {
    name: string;
    description?: string;
}

class ApiClient {
    async fetch(endpoint: string, options: RequestInit = {}) {
        const authToken = get(token);
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { Authorization: `Bearer ${authToken}` }),
                ...options.headers,
            },
        });

        if (response.status === 401) {
            token.set(null);
            goto('/login');
            throw new Error('Unauthorized');
        }

        return response;
    }

    async login(email: string, password: string) {
        const response = await this.fetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
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

    async createOrganization(data: CreateOrganizationDTO): Promise<Organization> {
        const response = await this.fetch('/organizations', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to create organization');
        return response.json();
    }

    async getOrganizationProjects(org_id : string): Promise<Project[]> {
        const response = await this.fetch('/organizations/'+org_id+'/projects');
        if (!response.ok) throw new Error('Failed to fetch projects');
        return response.json();
    }

    async getProject(org_id : string, project_id: string): Promise<Project> {
        const response = await this.fetch('/organizations/'+org_id+'/projects/'+project_id);
        if (!response.ok) throw new Error('Failed to fetch project');
        return response.json();
    }

    async getProviders(): Promise<Provider[]> {
        const response = await this.fetch('/providers');
        if (!response.ok) throw new Error('Failed to fetch providers');
        return response.json();
    }

    async createApiKey(org_id : string, project_id: string, data: ApiKeyDTO): Promise<ApiKeyDTO> {
        const response = await this.fetch('/organizations/'+org_id+'/projects/'+project_id+'/api-keys', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to create api key');
        return response.json();
    }

    async deleteApiKey(org_id : string, project_id: string, apiKeyId: string): Promise<{}> {
        const response = await this.fetch('/organizations/'+org_id+'/projects/'+project_id+'/api-keys/' + apiKeyId, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete api key');
        return response.json();
    }
}

export const api = new ApiClient();
