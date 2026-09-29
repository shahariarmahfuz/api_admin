import { StandardApiResponse, ProviderBlueprint, ProviderIntegration, TestHistoryItem } from './types';

const API_BASE_URL =
  typeof window !== 'undefined'
    ? ''
    : (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000');

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('orvia_token');
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('orvia_token', token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('orvia_token');
    localStorage.removeItem('orvia_user');
  }
}

export function getCurrentUserStored(): any | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('orvia_user');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function setCurrentUserStored(user: any): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('orvia_user', JSON.stringify(user));
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<StandardApiResponse<T>> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        data: null as any,
        message: data?.error?.message || 'Request failed',
        error: data?.error || { code: `HTTP_${res.status}`, message: res.statusText },
      };
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      data: null as any,
      message: err.message || 'Network error connecting to API',
      error: { code: 'NETWORK_ERROR', message: err.message },
    };
  }
}

export const api = {
  // Auth
  async login(payload: { email: string; password: string }): Promise<StandardApiResponse<any>> {
    const res = await request<any>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.success && res.data?.access_token) {
      setAuthToken(res.data.access_token);
      setCurrentUserStored(res.data.user);
    }
    return res;
  },

  async getMe(): Promise<StandardApiResponse<any>> {
    return request<any>('/api/v1/auth/me');
  },

  // Services / Catalog
  async getServices(params?: { category?: string; status?: string }): Promise<StandardApiResponse<any[]>> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    return request<any[]>(`/api/v1/services?${query.toString()}`);
  },

  async getServiceBySlug(slug: string): Promise<StandardApiResponse<any>> {
    return request<any>(`/api/v1/services/${slug}`);
  },

  async createService(data: any): Promise<StandardApiResponse<any>> {
    return request<any>('/api/v1/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateService(id: string, data: any): Promise<StandardApiResponse<any>> {
    return request<any>(`/api/v1/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteService(id: string): Promise<StandardApiResponse<any>> {
    return request<any>(`/api/v1/services/${id}`, {
      method: 'DELETE',
    });
  },

  // API Keys
  async getApiKeys(): Promise<StandardApiResponse<any[]>> {
    return request<any[]>('/api/v1/api_keys');
  },

  async createApiKey(data: { name: string; rate_limit_per_minute: number; rate_limit_per_day?: number }): Promise<StandardApiResponse<any>> {
    return request<any>('/api/v1/api_keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateApiKey(id: string, data: any): Promise<StandardApiResponse<any>> {
    return request<any>(`/api/v1/api_keys/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async revokeApiKey(id: string): Promise<StandardApiResponse<any>> {
    return request<any>(`/api/v1/api_keys/${id}`, {
      method: 'DELETE',
    });
  },

  // Logs & Analytics
  async getLogs(params?: {
    page?: number;
    page_size?: number;
    status_code?: number;
    endpoint?: string;
    category?: string;
    failed_only?: boolean;
  }): Promise<StandardApiResponse<any>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.page_size) query.set('page_size', params.page_size.toString());
    if (params?.status_code) query.set('status_code', params.status_code.toString());
    if (params?.endpoint) query.set('endpoint', params.endpoint);
    if (params?.category) query.set('category', params.category);
    if (params?.failed_only) query.set('failed_only', 'true');
    return request<any>(`/api/v1/logs?${query.toString()}`);
  },

  async getDashboardStats(): Promise<StandardApiResponse<any>> {
    return request<any>('/api/v1/logs/stats');
  },

  async getTopEndpoints(): Promise<StandardApiResponse<any[]>> {
    return request<any[]>('/api/v1/logs/top_endpoints');
  },

  async getStatusDistribution(): Promise<StandardApiResponse<Record<string, number>>> {
    return request<Record<string, number>>('/api/v1/logs/status_distribution');
  },

  // System Health & Settings
  async getSystemHealth(): Promise<StandardApiResponse<any>> {
    return request<any>('/api/v1/admin/health');
  },

  async getSystemSettings(): Promise<StandardApiResponse<any>> {
    return request<any>('/api/v1/admin/settings');
  },

  // Users
  async getUsers(): Promise<StandardApiResponse<any[]>> {
    return request<any[]>('/api/v1/users');
  },

  async createUser(data: any): Promise<StandardApiResponse<any>> {
    return request<any>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateUser(id: string, data: any): Promise<StandardApiResponse<any>> {
    return request<any>(`/api/v1/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id: string): Promise<StandardApiResponse<any>> {
    return request<any>(`/api/v1/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Providers & Real Integrations
  async getProviderBlueprints(): Promise<StandardApiResponse<ProviderBlueprint[]>> {
    return request<ProviderBlueprint[]>('/api/v1/admin/providers/available');
  },

  async testProviderConnection(payload: {
    provider_name: string;
    credentials: Record<string, any>;
    base_url?: string;
  }): Promise<StandardApiResponse<{ success: boolean; message: string; latency_ms: number; details?: any }>> {
    return request('/api/v1/admin/providers/test-connection', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getProviders(): Promise<StandardApiResponse<ProviderIntegration[]>> {
    return request<ProviderIntegration[]>('/api/v1/admin/providers');
  },

  async createProvider(data: {
    provider_name: string;
    display_name: string;
    base_url?: string;
    credentials: Record<string, any>;
    register_services?: boolean;
  }): Promise<StandardApiResponse<ProviderIntegration>> {
    return request<ProviderIntegration>('/api/v1/admin/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProvider(id: string, data: {
    display_name?: string;
    credentials: Record<string, any>;
  }): Promise<StandardApiResponse<ProviderIntegration>> {
    return request<ProviderIntegration>(`/api/v1/admin/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteProvider(id: string): Promise<StandardApiResponse<any>> {
    return request(`/api/v1/admin/providers/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin API Tester
  async executeAdminTest(data: {
    provider_id?: string;
    provider_name: string;
    api_slug?: string;
    operation: string;
    params?: Record<string, any>;
  }): Promise<StandardApiResponse<any>> {
    return request('/api/v1/admin/tester/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async executeAdminUploadTest(formData: FormData): Promise<StandardApiResponse<any>> {
    return request('/api/v1/admin/tester/execute-upload', {
      method: 'POST',
      body: formData,
    });
  },

  async getAdminTestHistory(limit: number = 20): Promise<StandardApiResponse<TestHistoryItem[]>> {
    return request<TestHistoryItem[]>(`/api/v1/admin/tester/history?limit=${limit}`);
  },

  // Interactive Live API Runner
  async testApiCall(
    method: string,
    endpoint: string,
    body?: any,
    apiKey?: string
  ): Promise<{ status: number; durationMs: number; data: any }> {
    const start = performance.now();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
      });
      const durationMs = Math.round(performance.now() - start);
      const data = await res.json();
      return { status: res.status, durationMs, data };
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - start);
      return {
        status: 0,
        durationMs,
        data: { success: false, error: { message: err.message || 'Network error' } },
      };
    }
  },
};
