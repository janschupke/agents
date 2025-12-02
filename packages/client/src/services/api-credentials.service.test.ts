import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { ApiCredentialsService } from './api-credentials.service';
import { API_BASE_URL } from '../constants/api.constants';

describe('ApiCredentialsService', () => {
  beforeEach(() => {
    // Suppress console.error in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('hasOpenAIKey', () => {
    it('should return true when OpenAI key exists', async () => {
      const result = await ApiCredentialsService.hasOpenAIKey();

      expect(result).toBe(true);
    });

    it('should return false when OpenAI key does not exist', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/api-credentials/openai/check`, () => {
          return HttpResponse.json({ hasKey: false });
        })
      );

      const result = await ApiCredentialsService.hasOpenAIKey();

      expect(result).toBe(false);
    });

    it('should return false and log error when check fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      server.use(
        http.get(`${API_BASE_URL}/api/api-credentials/openai/check`, () => {
          return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
        })
      );

      const result = await ApiCredentialsService.hasOpenAIKey();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to check OpenAI key:',
        expect.any(Object)
      );
    });
  });

  describe('setOpenAIKey', () => {
    it('should set OpenAI key successfully', async () => {
      await expect(ApiCredentialsService.setOpenAIKey('sk-test-key')).resolves.not.toThrow();
    });

    it('should throw error when setting key fails', async () => {
      server.use(
        http.post(`${API_BASE_URL}/api/api-credentials/openai`, () => {
          return HttpResponse.json({ message: 'Invalid API key' }, { status: 400 });
        })
      );

      await expect(ApiCredentialsService.setOpenAIKey('invalid-key')).rejects.toThrow();
    });
  });

  describe('deleteOpenAIKey', () => {
    it('should delete OpenAI key successfully', async () => {
      await expect(ApiCredentialsService.deleteOpenAIKey()).resolves.not.toThrow();
    });

    it('should throw error when deletion fails', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/api/api-credentials/openai`, () => {
          return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
        })
      );

      await expect(ApiCredentialsService.deleteOpenAIKey()).rejects.toThrow();
    });
  });
});
