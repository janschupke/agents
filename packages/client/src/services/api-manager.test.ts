import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiManager } from './api-manager';
import axiosInstance from './axios-instance';

// Mock axios
vi.mock('./axios-instance', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    defaults: {
      baseURL: 'http://localhost:3001',
    },
  };
  return {
    default: mockAxiosInstance,
  };
});

describe('ApiManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = { data: 'test' };
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await apiManager.get('/api/test');

      expect(result).toEqual(mockResponse);
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/test', {});
    });

    it('should handle query parameters', async () => {
      const mockResponse = { data: 'test' };
      vi.mocked(axiosInstance.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      await apiManager.get('/api/test', {
        params: { page: 1, limit: 10 },
      });

      expect(axiosInstance.get).toHaveBeenCalledWith('/api/test', {
        params: { page: 1, limit: 10 },
      });
    });
  });

  describe('POST requests', () => {
    it('should make POST request successfully', async () => {
      const mockResponse = { success: true };
      const requestData = { name: 'Test' };

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await apiManager.post('/api/test', requestData);

      expect(result).toEqual(mockResponse);
      expect(axiosInstance.post).toHaveBeenCalledWith('/api/test', requestData, {});
    });
  });

  describe('Error handling', () => {
    it('should throw ApiError on HTTP error', async () => {
      const error = {
        message: 'Not found',
        status: 404,
        data: { message: 'Not found' },
      };
      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error);

      await expect(apiManager.get('/api/test')).rejects.toMatchObject({
        message: 'Not found',
        status: 404,
      });
    });

    it('should handle network errors', async () => {
      const error = {
        message: 'Network error',
      };
      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error);

      await expect(apiManager.get('/api/test')).rejects.toMatchObject({
        message: 'Network error',
      });
    });
  });

  describe('Configuration', () => {
    it('should set and get base URL', () => {
      apiManager.setBaseURL('http://example.com');
      expect(apiManager.getBaseURL()).toBe('http://example.com');
    });
  });
});
