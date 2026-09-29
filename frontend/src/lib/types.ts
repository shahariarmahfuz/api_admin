export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: boolean;
  avatar_url?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecurityDetails {
  email: string;
  role: string;
  created_at: string;
  last_login_at: string | null;
  active_api_keys_count: number;
  password_last_changed: string | null;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  is_active: boolean;
  request_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  secret_key?: string;
}

export interface ApiService {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  endpoint: string;
  method: string;
  version: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'BETA';
  requires_auth: boolean;
  rate_limit_per_minute: number;
  documentation: {
    summary?: string;
    parameters?: Array<{
      name: string;
      type: string;
      required: boolean;
      default?: any;
      description?: string;
    }>;
    headers?: Array<{
      name: string;
      type: string;
      required: boolean;
      description?: string;
    }>;
    responses?: Record<string, any>;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface RequestLog {
  id: string;
  request_id: string;
  api_key_id: string | null;
  user_id: string | null;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  client_ip: string;
  error_message: string | null;
  api_slug: string | null;
  category: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_requests: number;
  requests_today: number;
  successful_requests: number;
  failed_requests: number;
  error_rate_percentage: number;
  average_response_time_ms: number;
  active_api_keys: number;
  active_apis: number;
  system_status: string;
}

export interface EndpointUsageStat {
  endpoint: string;
  method: string;
  total_calls: number;
  avg_latency_ms: number;
  error_count: number;
}

export interface StandardApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProviderFieldSchema {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url';
  required: boolean;
  placeholder?: string;
  description?: string;
  default?: string;
}

export interface ProviderBlueprint {
  provider_name: string;
  display_name: string;
  description: string;
  icon: string;
  category: string;
  docs_url?: string;
  fields: ProviderFieldSchema[];
  supported_operations: string[];
}

export interface ProviderIntegration {
  id: string;
  user_id: string;
  provider_name: string;
  display_name: string;
  base_url?: string | null;
  status: string;
  last_tested_at?: string | null;
  created_at: string;
  updated_at: string;
  masked_credentials: Record<string, string>;
  api_services: ApiService[];
}

export interface TestHistoryItem {
  id: string;
  provider_id?: string | null;
  provider_name: string;
  api_slug?: string | null;
  operation: string;
  status_code: number;
  response_time_ms: number;
  success: boolean;
  error_message?: string | null;
  created_at: string;
}
