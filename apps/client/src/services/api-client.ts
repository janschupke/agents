import { API_BASE_URL } from '../constants/api.constants';
import { tokenProvider } from './token-provider';

interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
  expected?: boolean;
}

interface ApiRequestOptions extends RequestInit {
  skipErrorHandling?: boolean;
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Get base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Set base URL
   */
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }

  /**
   * Build full URL with query parameters
   */
  private buildURL(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): string {
    // Handle relative and absolute URLs
    let fullUrl: string;
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      fullUrl = endpoint;
    } else {
      // Ensure baseURL ends with / and endpoint doesn't start with /
      const base = this.baseURL.endsWith('/')
        ? this.baseURL.slice(0, -1)
        : this.baseURL;
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      fullUrl = `${base}${path}`;
    }

    // Add query parameters
    if (params && Object.keys(params).length > 0) {
      const url = new URL(fullUrl);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
      return url.toString();
    }

    return fullUrl;
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string | null> {
    // Skip delays in test environment
    const isTest =
      import.meta.env.MODE === 'test' || import.meta.env.VITEST === 'true';

    // Wait for token provider to be ready if it's not yet
    if (!tokenProvider.isReady() && !isTest) {
      // Wait up to 500ms for token provider to be set up (only in non-test)
      for (let i = 0; i < 10; i++) {
        if (tokenProvider.isReady()) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // Try to get token
    let token = await tokenProvider.getToken();

    // If no token and token provider is ready, wait a bit and retry once (only in non-test)
    if (!token && tokenProvider.isReady() && !isTest) {
      // Small delay to allow token to be fetched
      await new Promise((resolve) => setTimeout(resolve, 100));
      token = await tokenProvider.getToken();
    }

    return token;
  }

  /**
   * Handle error response
   */
  private async handleError(response: Response): Promise<ApiError> {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: response.status,
      data: undefined,
    };

    try {
      const data = await response.json();
      apiError.data = data;

      if (typeof data === 'object' && data !== null && 'message' in data) {
        apiError.message = String(data.message);
      }
    } catch {
      // If response is not JSON, use status text
      apiError.message = response.statusText || 'An unexpected error occurred';
    }

    // Handle 401 errors
    if (response.status === 401) {
      const token = await tokenProvider.getToken();
      if (!token) {
        apiError.message = 'Authentication required';
        apiError.expected = true;
      } else {
        apiError.message =
          'Authentication failed - token may be invalid or expired';
        apiError.expected = true;
      }
    }

    return apiError;
  }

  /**
   * Make a request
   */
  private async request<T>(
    endpoint: string,
    method: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    const { skipErrorHandling, params, headers, ...fetchOptions } =
      options || {};

    const url = this.buildURL(endpoint, params);
    const token = await this.getAuthToken();

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
      ...fetchOptions,
    };

    if (data !== undefined && method !== 'GET' && method !== 'DELETE') {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await this.handleError(response);
        if (skipErrorHandling) {
          throw error;
        }
        throw error;
      }

      // Handle empty responses (e.g., 204 No Content or DELETE requests)
      if (
        response.status === 204 ||
        (response.status === 201 &&
          response.headers.get('content-length') === '0')
      ) {
        return {} as T;
      }

      // Handle JSON responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (!text) {
          return {} as T;
        }
        return JSON.parse(text) as T;
      }

      // Return empty object for non-JSON responses
      return {} as T;
    } catch (error) {
      if (skipErrorHandling) {
        throw error;
      }

      // If it's already an ApiError, re-throw it
      if (error && typeof error === 'object' && 'message' in error) {
        throw error;
      }

      // Otherwise, wrap it
      throw {
        message: error instanceof Error ? error.message : 'Network error',
        expected: false,
      } as ApiError;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'GET', undefined, options);
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, 'POST', data, options);
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, 'PUT', data, options);
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, 'PATCH', data, options);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', undefined, options);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
