import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestQueryProvider } from '../../test/utils/test-query-provider';
import { useUser, useApiKeyStatus } from './use-user';
import { UserService } from '../../services/user/user.service';
import { ApiCredentialsService } from '../../services/user/api-credentials.service';

// Mock AuthContext
const mockAuth = {
  isSignedIn: true,
  isLoaded: true,
};
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

// Mock useTokenReady
vi.mock('../use-token-ready', () => ({
  useTokenReady: () => true,
}));

// Mock services
vi.mock('../../services/user/user.service');
vi.mock('../../services/user/api-credentials.service');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('use-user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useUser', () => {
    it('should fetch current user when signed in and loaded', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: null,
        roles: [],
      };

      vi.mocked(UserService.getCurrentUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUser(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUser);
    });

    it('should not fetch when not signed in', () => {
      mockAuth.isSignedIn = false;
      mockAuth.isLoaded = true;

      const { result } = renderHook(() => useUser(), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(UserService.getCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('useApiKeyStatus', () => {
    it('should fetch API key status when signed in and loaded', async () => {
      mockAuth.isSignedIn = true;
      mockAuth.isLoaded = true;

      vi.mocked(ApiCredentialsService.hasOpenAIKey).mockResolvedValue(true);

      const { result } = renderHook(() => useApiKeyStatus(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ hasApiKey: true });
    });

    it('should return false when API key does not exist', async () => {
      vi.mocked(ApiCredentialsService.hasOpenAIKey).mockResolvedValue(false);

      const { result } = renderHook(() => useApiKeyStatus(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ hasApiKey: false });
    });

    it('should not fetch when not signed in', () => {
      mockAuth.isSignedIn = false;
      mockAuth.isLoaded = true;

      const { result } = renderHook(() => useApiKeyStatus(), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(ApiCredentialsService.hasOpenAIKey).not.toHaveBeenCalled();
    });
  });
});
