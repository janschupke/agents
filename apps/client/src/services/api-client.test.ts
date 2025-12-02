import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { apiClient } from './api-client';
import { tokenProvider } from './token-provider';
import { API_BASE_URL } from '../constants/api.constants';

describe('ApiClient', () => {
  beforeEach(() => {
    tokenProvider.clearTokenGetter();
    tokenProvider.setToken(null);
    apiClient.setBaseURL(API_BASE_URL);
  });

  describe('getBaseURL and setBaseURL', () => {
    it('should get and set base URL', () => {
      const newBaseURL = 'https://api.example.com';
      apiClient.setBaseURL(newBaseURL);
      expect(apiClient.getBaseURL()).toBe(newBaseURL);
    });
  });

  describe('buildURL', () => {
    it('should build URL with relative endpoint', () => {
      apiClient.setBaseURL('https://api.example.com');
      // Access private method via type assertion for testing
      const url = (
        apiClient as unknown as {
          buildURL: (
            endpoint: string,
            params?: Record<string, string | number | boolean>
          ) => string;
        }
      ).buildURL('/api/test');
      expect(url).toBe('https://api.example.com/api/test');
    });

    it('should build URL with absolute endpoint', () => {
      const url = (
        apiClient as unknown as {
          buildURL: (
            endpoint: string,
            params?: Record<string, string | number | boolean>
          ) => string;
        }
      ).buildURL('https://external.com/api');
      expect(url).toBe('https://external.com/api');
    });

    it('should build URL with query parameters', () => {
      apiClient.setBaseURL('https://api.example.com');
      const url = (
        apiClient as unknown as {
          buildURL: (
            endpoint: string,
            params?: Record<string, string | number | boolean>
          ) => string;
        }
      ).buildURL('/api/test', { foo: 'bar', num: 123, bool: true });
      expect(url).toContain('foo=bar');
      expect(url).toContain('num=123');
      expect(url).toContain('bool=true');
    });

    it('should handle baseURL with trailing slash', () => {
      apiClient.setBaseURL('https://api.example.com/');
      const url = (
        apiClient as unknown as {
          buildURL: (
            endpoint: string,
            params?: Record<string, string | number | boolean>
          ) => string;
        }
      ).buildURL('/api/test');
      expect(url).toBe('https://api.example.com/api/test');
    });

    it('should handle endpoint without leading slash', () => {
      apiClient.setBaseURL('https://api.example.com');
      const url = (
        apiClient as unknown as {
          buildURL: (
            endpoint: string,
            params?: Record<string, string | number | boolean>
          ) => string;
        }
      ).buildURL('api/test');
      expect(url).toBe('https://api.example.com/api/test');
    });

    it('should skip undefined and null params', () => {
      apiClient.setBaseURL('https://api.example.com');
      const url = (
        apiClient as unknown as {
          buildURL: (
            endpoint: string,
            params?: Record<string, string | number | boolean>
          ) => string;
        }
      ).buildURL('/api/test', {
        foo: 'bar',
        undefined: undefined as unknown as string,
        null: null as unknown as string,
      });
      expect(url).toContain('foo=bar');
      expect(url).not.toContain('undefined');
      expect(url).not.toContain('null');
    });
  });

  describe('getAuthToken', () => {
    it('should get token from token provider when ready', async () => {
      tokenProvider.setTokenGetter(async () => 'test-token');

      server.use(
        http.get(`${API_BASE_URL}/api/test`, ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          expect(authHeader).toBe('Bearer test-token');
          return HttpResponse.json({ success: true });
        })
      );

      await apiClient.get('/api/test');
    });

    it('should make request without token when token provider not ready', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/test`, ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          expect(authHeader).toBeNull();
          return HttpResponse.json({ success: true });
        })
      );

      await apiClient.get('/api/test');
    });

    it('should use currentToken as fallback', async () => {
      tokenProvider.setToken('fallback-token');

      server.use(
        http.get(`${API_BASE_URL}/api/test`, ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          expect(authHeader).toBe('Bearer fallback-token');
          return HttpResponse.json({ success: true });
        })
      );

      await apiClient.get('/api/test');
    });
  });

  describe('GET requests', () => {
    it('should make GET request successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      server.use(
        http.get(`${API_BASE_URL}/api/test`, () => {
          return HttpResponse.json(mockData);
        })
      );

      const result = await apiClient.get<typeof mockData>('/api/test');
      expect(result).toEqual(mockData);
    });

    it('should make GET request with query parameters', async () => {
      const mockData = { id: 1 };
      server.use(
        http.get(`${API_BASE_URL}/api/test`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('foo')).toBe('bar');
          return HttpResponse.json(mockData);
        })
      );

      await apiClient.get('/api/test', { params: { foo: 'bar' } });
    });
  });

  describe('POST requests', () => {
    it('should make POST request with data successfully', async () => {
      const mockData = { id: 1, name: 'Created' };
      const requestData = { name: 'Test' };

      server.use(
        http.post(`${API_BASE_URL}/api/test`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual(requestData);
          return HttpResponse.json(mockData);
        })
      );

      const result = await apiClient.post<typeof mockData>(
        '/api/test',
        requestData
      );
      expect(result).toEqual(mockData);
    });

    it('should make POST request without data', async () => {
      server.use(
        http.post(`${API_BASE_URL}/api/test`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      const result = await apiClient.post('/api/test');
      expect(result).toEqual({ success: true });
    });
  });

  describe('PUT requests', () => {
    it('should make PUT request with data successfully', async () => {
      const mockData = { id: 1, name: 'Updated' };
      const requestData = { name: 'Updated' };

      server.use(
        http.put(`${API_BASE_URL}/api/test/1`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual(requestData);
          return HttpResponse.json(mockData);
        })
      );

      const result = await apiClient.put<typeof mockData>(
        '/api/test/1',
        requestData
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('PATCH requests', () => {
    it('should make PATCH request with data successfully', async () => {
      const mockData = { id: 1, name: 'Patched' };
      const requestData = { name: 'Patched' };

      server.use(
        http.patch(`${API_BASE_URL}/api/test/1`, async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual(requestData);
          return HttpResponse.json(mockData);
        })
      );

      const result = await apiClient.patch<typeof mockData>(
        '/api/test/1',
        requestData
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('DELETE requests', () => {
    it('should make DELETE request successfully', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/api/test/1`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      const result = await apiClient.delete('/api/test/1');
      expect(result).toEqual({ success: true });
    });

    it('should handle 204 No Content response', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/api/test/1`, () => {
          return new Response(null, { status: 204 });
        })
      );

      const result = await apiClient.delete('/api/test/1');
      expect(result).toEqual({});
    });
  });

  describe('Error handling', () => {
    it('should handle 401 Unauthorized error', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/test`, () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
          );
        })
      );

      await expect(apiClient.get('/api/test')).rejects.toMatchObject({
        message: expect.stringContaining('Authentication'),
        status: 401,
        expected: true,
      });
    });

    it('should handle 404 Not Found error', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/test`, () => {
          return HttpResponse.json({ message: 'Not found' }, { status: 404 });
        })
      );

      await expect(apiClient.get('/api/test')).rejects.toMatchObject({
        message: 'Not found',
        status: 404,
      });
    });

    it('should handle 500 Internal Server Error', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/test`, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(apiClient.get('/api/test')).rejects.toMatchObject({
        message: 'Internal server error',
        status: 500,
      });
    });

    it('should handle non-JSON error response', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/test`, () => {
          return new Response('Internal Server Error', { status: 500 });
        })
      );

      await expect(apiClient.get('/api/test')).rejects.toMatchObject({
        status: 500,
      });
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/test`, () => {
          return HttpResponse.error();
        })
      );

      await expect(apiClient.get('/api/test')).rejects.toThrow();
    });

    it('should skip error handling when skipErrorHandling is true', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/test`, () => {
          return HttpResponse.json({ message: 'Error' }, { status: 500 });
        })
      );

      await expect(
        apiClient.get('/api/test', { skipErrorHandling: true })
      ).rejects.toThrow();
    });
  });

  describe('Response handling', () => {
    it('should handle empty JSON response', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/test`, () => {
          return new Response('', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const result = await apiClient.get('/api/test');
      expect(result).toEqual({});
    });

    it('should handle non-JSON response', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/test`, () => {
          return new Response('Plain text', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          });
        })
      );

      const result = await apiClient.get('/api/test');
      expect(result).toEqual({});
    });

    it('should handle 201 Created with empty body', async () => {
      server.use(
        http.post(`${API_BASE_URL}/api/test`, () => {
          return new Response(null, {
            status: 201,
            headers: { 'Content-Length': '0' },
          });
        })
      );

      const result = await apiClient.post('/api/test');
      expect(result).toEqual({});
    });
  });

  describe('Custom headers', () => {
    it('should include custom headers in request', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/test`, ({ request }) => {
          expect(request.headers.get('X-Custom-Header')).toBe('custom-value');
          return HttpResponse.json({ success: true });
        })
      );

      await apiClient.get('/api/test', {
        headers: { 'X-Custom-Header': 'custom-value' },
      });
    });

    it('should override Content-Type when provided', async () => {
      server.use(
        http.post(`${API_BASE_URL}/api/test`, ({ request }) => {
          expect(request.headers.get('Content-Type')).toBe('text/plain');
          return HttpResponse.json({ success: true });
        })
      );

      await apiClient.post(
        '/api/test',
        { data: 'test' },
        {
          headers: { 'Content-Type': 'text/plain' },
        }
      );
    });
  });
});
