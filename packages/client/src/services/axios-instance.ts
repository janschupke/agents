import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../constants/api.constants';
import { tokenProvider } from './token-provider';

export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
  expected?: boolean;
}

// Create axios instance
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - inject Clerk token
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Wait for token provider to be ready if it's not yet
    if (!tokenProvider.isReady() && config.headers) {
      // Wait up to 500ms for token provider to be set up
      for (let i = 0; i < 10; i++) {
        if (tokenProvider.isReady()) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // Try to get token, with retry logic for race conditions
    let token = await tokenProvider.getToken();
    
    // If no token and token provider is ready, wait a bit and retry once
    if (!token && tokenProvider.isReady() && config.headers) {
      // Small delay to allow token to be fetched
      await new Promise((resolve) => setTimeout(resolve, 100));
      token = await tokenProvider.getToken();
    }
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };

    // Extract error message from response
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as { message?: string };
      if (data.message) {
        apiError.message = data.message;
      }
    } else if (error.message) {
      apiError.message = error.message;
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
      const token = await tokenProvider.getToken();
      if (!token) {
        apiError.message = 'Authentication required';
        apiError.expected = true;
      } else {
        apiError.message = 'Authentication failed - token may be invalid or expired';
        apiError.expected = true;
      }
    }

    return Promise.reject(apiError);
  }
);

export default axiosInstance;
