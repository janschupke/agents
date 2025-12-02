import { AxiosRequestConfig } from 'axios';
import axiosInstance, { ApiError } from './axios-instance';

export interface ApiRequestOptions extends Omit<AxiosRequestConfig, 'url' | 'method'> {
  skipErrorHandling?: boolean;
}

// Re-export ApiError for backward compatibility
export type { ApiError };

export class ApiManager {
  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    const { skipErrorHandling, ...axiosConfig } = options || {};
    try {
      const response = await axiosInstance.get<T>(endpoint, axiosConfig);
      return response.data;
    } catch (error) {
      if (skipErrorHandling) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    const { skipErrorHandling, ...axiosConfig } = options || {};
    try {
      const response = await axiosInstance.post<T>(endpoint, data, axiosConfig);
      return response.data;
    } catch (error) {
      if (skipErrorHandling) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    const { skipErrorHandling, ...axiosConfig } = options || {};
    try {
      const response = await axiosInstance.put<T>(endpoint, data, axiosConfig);
      return response.data;
    } catch (error) {
      if (skipErrorHandling) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    const { skipErrorHandling, ...axiosConfig } = options || {};
    try {
      const response = await axiosInstance.patch<T>(endpoint, data, axiosConfig);
      return response.data;
    } catch (error) {
      if (skipErrorHandling) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    const { skipErrorHandling, ...axiosConfig } = options || {};
    try {
      const response = await axiosInstance.delete<T>(endpoint, axiosConfig);
      return response.data;
    } catch (error) {
      if (skipErrorHandling) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Get base URL
   */
  getBaseURL(): string {
    return axiosInstance.defaults.baseURL || '';
  }

  /**
   * Set base URL
   */
  setBaseURL(baseURL: string): void {
    axiosInstance.defaults.baseURL = baseURL;
  }
}

// Export singleton instance
export const apiManager = new ApiManager();
