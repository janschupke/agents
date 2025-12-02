import { API_BASE_URL } from '../constants/api.constants.js';
import { tokenProvider } from './token-provider.js';

interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number>;
  skipErrorHandling?: boolean;
}

// Function to get Clerk session token
async function getClerkToken(): Promise<string | null> {
  return tokenProvider.getToken();
}

interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
  expected?: boolean;
}

class ApiManager {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private buildURL(
    endpoint: string,
    params?: Record<string, string | number>
  ): string {
    const url = new URL(endpoint, this.baseURL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`,
      }));

      const error: ApiError = {
        message: errorData.message || `HTTP error! status: ${response.status}`,
        status: response.status,
        data: errorData,
      };

      if (response.status === 401) {
        const token = await getClerkToken();
        if (!token) {
          throw {
            ...error,
            message: 'Authentication required',
            expected: true,
          } as ApiError & { expected: boolean };
        }
      }

      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { params, skipErrorHandling, ...fetchOptions } = options;

    const url = this.buildURL(endpoint, params);

    // Get token with retry logic
    let token = await getClerkToken();
    if (!token) {
      // Wait a bit and try again (token provider might not be ready yet)
      await new Promise((resolve) => setTimeout(resolve, 100));
      token = await getClerkToken();
    }

    if (!token) {
      console.warn('[API Manager] No token available for request to:', url);
    }

    const headers = {
      ...this.defaultHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...fetchOptions.headers,
    };

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (skipErrorHandling) {
        throw error;
      }

      const apiError: ApiError = {
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      };

      throw apiError;
    }
  }

  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

export const apiManager = new ApiManager();
