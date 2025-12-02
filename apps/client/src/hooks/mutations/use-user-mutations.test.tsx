import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestQueryProvider } from '../../test/utils/test-query-provider';
import { useUpdateApiKey, useDeleteApiKey } from './use-user-mutations';
import { ApiCredentialsService } from '../../services/api-credentials.service';

// Mock ToastContext
const mockShowToast = vi.fn();
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock services
vi.mock('../../services/api-credentials.service');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('use-user-mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useUpdateApiKey', () => {
    it('should update API key and show success toast', async () => {
      vi.mocked(ApiCredentialsService.setOpenAIKey).mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdateApiKey(), { wrapper });

      await result.current.mutateAsync('sk-test-key');

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'API key updated successfully',
          'success'
        );
      });
    });

    it('should show error toast on failure', async () => {
      const error = { message: 'Failed to update API key' };
      vi.mocked(ApiCredentialsService.setOpenAIKey).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateApiKey(), { wrapper });

      await expect(result.current.mutateAsync('sk-test-key')).rejects.toThrow();

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Failed to update API key',
          'error'
        );
      });
    });
  });

  describe('useDeleteApiKey', () => {
    it('should delete API key and show success toast', async () => {
      vi.mocked(ApiCredentialsService.deleteOpenAIKey).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteApiKey(), { wrapper });

      await result.current.mutateAsync();

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'API key deleted successfully',
          'success'
        );
      });
    });

    it('should show error toast on failure', async () => {
      const error = { message: 'Failed to delete API key' };
      vi.mocked(ApiCredentialsService.deleteOpenAIKey).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteApiKey(), { wrapper });

      await expect(result.current.mutateAsync()).rejects.toThrow();

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Failed to delete API key',
          'error'
        );
      });
    });
  });
});
