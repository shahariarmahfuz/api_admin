export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
