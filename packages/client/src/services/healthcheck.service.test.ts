import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthcheckService, HealthcheckResponse } from './healthcheck.service.js';
import { apiManager } from './api-manager.js';

// Mock ApiManager
vi.mock('./api-manager.js', () => ({
  apiManager: {
    get: vi.fn(),
  },
}));

describe('HealthcheckService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('check', () => {
    it('should check API health status successfully', async () => {
      const mockResponse: HealthcheckResponse = {
        status: 'ok',
        message: 'API is healthy',
        bots: [
          {
            id: 1,
            name: 'Test Bot',
            description: 'Test Description',
          },
        ],
      };

      vi.mocked(apiManager.get).mockResolvedValueOnce(mockResponse);

      const result = await HealthcheckService.check();

      expect(result).toEqual(mockResponse);
      expect(apiManager.get).toHaveBeenCalledWith('/api/healthcheck');
    });

    it('should return health status with empty bots array', async () => {
      const mockResponse: HealthcheckResponse = {
        status: 'ok',
        message: 'API is healthy',
        bots: [],
      };

      vi.mocked(apiManager.get).mockResolvedValueOnce(mockResponse);

      const result = await HealthcheckService.check();

      expect(result).toEqual(mockResponse);
      expect(result.bots).toEqual([]);
    });

    it('should throw error when healthcheck fails', async () => {
      vi.mocked(apiManager.get).mockRejectedValueOnce({
        message: 'Service unavailable',
        status: 503,
      });

      await expect(HealthcheckService.check()).rejects.toThrow();
    });
  });
});
