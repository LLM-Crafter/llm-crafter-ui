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
}

export const api = new ApiClient();
