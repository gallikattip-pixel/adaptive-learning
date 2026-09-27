import { API_CONFIG } from './config';
import type { ApiResponse, ApiErrorResponse } from '@/types/api';

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('student_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async get<T>(endpoint: string, queryParams?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = new URL(`${API_CONFIG.baseUrl}${endpoint}`, window.location.origin);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, val]) => url.searchParams.append(key, val));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        ...API_CONFIG.headers,
        ...this.getAuthHeader(),
      },
    });

    return this.handleResponse<T>(response);
  }

  async post<T, B = unknown>(endpoint: string, body?: B): Promise<ApiResponse<T>> {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...API_CONFIG.headers,
        ...this.getAuthHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T, B = unknown>(endpoint: string, body?: B): Promise<ApiResponse<T>> {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...API_CONFIG.headers,
        ...this.getAuthHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      let errorData: ApiErrorResponse['error'];
      try {
        const parsed = await response.json();
        errorData = parsed.error || { code: 'HTTP_ERROR', message: `Server returned status ${response.status}` };
      } catch {
        errorData = { code: 'UNKNOWN_ERROR', message: `Network response was not ok (${response.status})` };
      }
      const err = new Error(errorData.message);
      Object.assign(err, { code: errorData.code, status: response.status });
      throw err;
    }

    const json = await response.json();
    // Normalize response: if json already has a 'data' key, use it; otherwise wrap json as data payload
    const dataPayload = (json && typeof json === 'object' && 'data' in json) ? json.data : json;

    return {
      data: dataPayload as T,
      status: response.status,
      message: json?.message,
      timestamp: json?.timestamp || new Date().toISOString(),
    };
  }
}

export const apiClient = new ApiClient();
