import { describe, it, expect } from 'vitest';
import { apiManager } from './api-manager';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../constants/api.constants';

describe('ApiManager', () => {
  describe('GET requests', () => {
    it('should make GET request successfully', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/test`, () => {
          return HttpResponse.json({ data: 'test' });
        })
      );

      const result = await apiManager.get('/api/test');

      expect(result).toEqual({ data: 'test' });
    });

    it('should handle query parameters', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/test`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('page')).toBe('1');
          expect(url.searchParams.get('limit')).toBe('10');
          return HttpResponse.json({ data: 'test' });
        })
      );

      await apiManager.get('/api/test', {
        params: { page: 1, limit: 10 },
      });
    });
  });

  describe('POST requests', () => {
    it('should make POST request successfully', async () => {
      const requestData = { name: 'Test' };

      server.use(
        http.post(`${API_BASE_URL}/api/test`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual(requestData);
          return HttpResponse.json({ success: true });
        })
      );

      const result = await apiManager.post('/api/test', requestData);

      expect(result).toEqual({ success: true });
    });
  });

  describe('Error handling', () => {
    it('should throw ApiError on HTTP error', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/test`, () => {
          return HttpResponse.json({ message: 'Not found' }, { status: 404 });
        })
      );

      await expect(apiManager.get('/api/test')).rejects.toMatchObject({
        message: 'Not found',
        status: 404,
      });
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/test`, () => {
          return HttpResponse.error();
        })
      );

      await expect(apiManager.get('/api/test')).rejects.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should set and get base URL', () => {
      apiManager.setBaseURL('http://example.com');
      expect(apiManager.getBaseURL()).toBe('http://example.com');
    });
  });
});
