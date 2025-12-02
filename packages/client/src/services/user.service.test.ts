import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './user.service';
import { User } from '../types/chat.types';
import { apiManager } from './api-manager';

// Mock ApiManager
vi.mock('./api-manager', () => ({
  apiManager: {
    get: vi.fn(),
  },
}));

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const mockUser: User = {
        id: 'user_123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: 'https://example.com/avatar.jpg',
        roles: [],
      };

      vi.mocked(apiManager.get).mockResolvedValueOnce(mockUser);

      const result = await UserService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(apiManager.get).toHaveBeenCalledWith('/api/user/me');
    });

    it('should throw error when user not authenticated', async () => {
      vi.mocked(apiManager.get).mockRejectedValueOnce({
        message: 'Unauthorized',
        status: 401,
      });

      await expect(UserService.getCurrentUser()).rejects.toThrow();
    });

    it('should throw error when fetch fails', async () => {
      vi.mocked(apiManager.get).mockRejectedValueOnce({
        message: 'Internal server error',
        status: 500,
      });

      await expect(UserService.getCurrentUser()).rejects.toThrow();
    });
  });
});
