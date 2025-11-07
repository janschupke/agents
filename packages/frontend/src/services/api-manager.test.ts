import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiManager, ApiError } from './api-manager.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('ApiManager', () => {
  let apiManager: ApiManager;

  beforeEach(() => {
    vi.clearAllMocks();
    apiManager = new ApiManager('http://localhost:3001');
  });

  describe('GET requests', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = { data: 'test' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const result = await apiManager.get('/api/test');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should handle query parameters', async () => {
      const mockResponse = { data: 'test' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await apiManager.get('/api/test', {
        params: { page: 1, limit: 10 },
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test?page=1&limit=10',
        expect.any(Object),
      );
    });
  });

  describe('POST requests', () => {
    it('should make POST request successfully', async () => {
      const mockResponse = { success: true };
      const requestData = { name: 'Test' };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const result = await apiManager.post('/api/test', requestData);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });
  });

  describe('Error handling', () => {
    it('should throw ApiError on HTTP error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await expect(apiManager.get('/api/test')).rejects.toMatchObject({
        message: 'Not found',
        status: 404,
      });
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

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

    it('should set default headers', () => {
      apiManager.setDefaultHeaders({ Authorization: 'Bearer token' });
      
      const mockResponse = { data: 'test' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      apiManager.get('/api/test');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
          }),
        }),
      );
    });
  });
});
