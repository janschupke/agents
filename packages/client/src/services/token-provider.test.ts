import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tokenProvider } from './token-provider.js';

describe('tokenProvider', () => {
  beforeEach(() => {
    // Reset token provider state
    tokenProvider.clearTokenGetter();
    tokenProvider.setToken(null);
    // Suppress console logs in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setToken and getToken', () => {
    it('should set and get token', async () => {
      tokenProvider.setToken('test-token-123');

      const result = await tokenProvider.getToken();

      expect(result).toBe('test-token-123');
    });

    it('should return null when no token is set', async () => {
      const result = await tokenProvider.getToken();

      expect(result).toBeNull();
    });

    it('should update token when set multiple times', async () => {
      tokenProvider.setToken('token-1');
      expect(await tokenProvider.getToken()).toBe('token-1');

      tokenProvider.setToken('token-2');
      expect(await tokenProvider.getToken()).toBe('token-2');
    });
  });

  describe('setTokenGetter and getToken', () => {
    it('should use token getter when set', async () => {
      const mockGetter = vi.fn().mockResolvedValue('getter-token-123');
      tokenProvider.setTokenGetter(mockGetter);

      const result = await tokenProvider.getToken();

      expect(result).toBe('getter-token-123');
      expect(mockGetter).toHaveBeenCalledTimes(1);
    });

    it('should prefer token getter over cached token', async () => {
      tokenProvider.setToken('cached-token');
      const mockGetter = vi.fn().mockResolvedValue('getter-token');
      tokenProvider.setTokenGetter(mockGetter);

      const result = await tokenProvider.getToken();

      expect(result).toBe('getter-token');
      expect(mockGetter).toHaveBeenCalledTimes(1);
    });

    it('should fall back to cached token when getter fails', async () => {
      tokenProvider.setToken('cached-token');
      const mockGetter = vi.fn().mockRejectedValue(new Error('Getter failed'));
      tokenProvider.setTokenGetter(mockGetter);

      const result = await tokenProvider.getToken();

      expect(result).toBe('cached-token');
      expect(mockGetter).toHaveBeenCalledTimes(1);
    });

    it('should return null when getter returns null', async () => {
      const mockGetter = vi.fn().mockResolvedValue(null);
      tokenProvider.setTokenGetter(mockGetter);

      const result = await tokenProvider.getToken();

      expect(result).toBeNull();
    });
  });

  describe('clearTokenGetter', () => {
    it('should clear token getter and cached token', async () => {
      tokenProvider.setToken('test-token');
      const mockGetter = vi.fn().mockResolvedValue('getter-token');
      tokenProvider.setTokenGetter(mockGetter);

      tokenProvider.clearTokenGetter();

      const result = await tokenProvider.getToken();
      expect(result).toBeNull();
      expect(mockGetter).not.toHaveBeenCalled();
    });
  });
});
