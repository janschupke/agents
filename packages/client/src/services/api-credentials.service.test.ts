import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiCredentialsService } from './api-credentials.service';
import { apiManager } from './api-manager';

// Mock ApiManager
vi.mock('./api-manager', () => ({
  apiManager: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ApiCredentialsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('hasOpenAIKey', () => {
    it('should return true when OpenAI key exists', async () => {
      vi.mocked(apiManager.get).mockResolvedValueOnce({ hasKey: true });

      const result = await ApiCredentialsService.hasOpenAIKey();

      expect(result).toBe(true);
      expect(apiManager.get).toHaveBeenCalledWith('/api/api-credentials/openai/check');
    });

    it('should return false when OpenAI key does not exist', async () => {
      vi.mocked(apiManager.get).mockResolvedValueOnce({ hasKey: false });

      const result = await ApiCredentialsService.hasOpenAIKey();

      expect(result).toBe(false);
    });

    it('should return false and log error when check fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      vi.mocked(apiManager.get).mockRejectedValueOnce({
        message: 'Internal server error',
        status: 500,
      });

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
      vi.mocked(apiManager.post).mockResolvedValueOnce(undefined);

      await ApiCredentialsService.setOpenAIKey('sk-test-key');

      expect(apiManager.post).toHaveBeenCalledWith('/api/api-credentials/openai', {
        apiKey: 'sk-test-key',
      });
    });

    it('should throw error when setting key fails', async () => {
      vi.mocked(apiManager.post).mockRejectedValueOnce({
        message: 'Invalid API key',
        status: 400,
      });

      await expect(ApiCredentialsService.setOpenAIKey('invalid-key')).rejects.toThrow();
    });
  });

  describe('deleteOpenAIKey', () => {
    it('should delete OpenAI key successfully', async () => {
      vi.mocked(apiManager.delete).mockResolvedValueOnce(undefined);

      await ApiCredentialsService.deleteOpenAIKey();

      expect(apiManager.delete).toHaveBeenCalledWith('/api/api-credentials/openai');
    });

    it('should throw error when deletion fails', async () => {
      vi.mocked(apiManager.delete).mockRejectedValueOnce({
        message: 'Internal server error',
        status: 500,
      });

      await expect(ApiCredentialsService.deleteOpenAIKey()).rejects.toThrow();
    });
  });
});
