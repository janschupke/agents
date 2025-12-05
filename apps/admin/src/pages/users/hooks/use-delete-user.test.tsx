import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDeleteUser } from './use-delete-user';
import { UserService } from '../../../services/user.service';
import { useToast } from '../../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { TestQueryProvider } from '../../../test/utils/test-query-provider';

vi.mock('../../../services/user.service');
vi.mock('../../../contexts/ToastContext');
vi.mock('react-router-dom');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useDeleteUser', () => {
  const mockShowToast = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({
      showToast: mockShowToast,
    } as ReturnType<typeof useToast>);
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  it('should delete user and show success toast', async () => {
    const userId = 'user_1';
    vi.mocked(UserService.deleteUser).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteUser(), { wrapper });

    result.current.mutate(userId);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(UserService.deleteUser).toHaveBeenCalledWith(userId);
    expect(mockShowToast).toHaveBeenCalledWith(
      'users.delete.success',
      'success'
    );
  });

  it('should call onSuccess callback when provided', async () => {
    const userId = 'user_1';
    const onSuccess = vi.fn();
    vi.mocked(UserService.deleteUser).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteUser({ onSuccess }), {
      wrapper,
    });

    result.current.mutate(userId);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('should redirect on success when redirectOnSuccess is true', async () => {
    const userId = 'user_1';
    vi.mocked(UserService.deleteUser).mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useDeleteUser({ redirectOnSuccess: true }),
      { wrapper }
    );

    result.current.mutate(userId);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/users');
  });

  it('should not redirect when redirectOnSuccess is false', async () => {
    const userId = 'user_1';
    vi.mocked(UserService.deleteUser).mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useDeleteUser({ redirectOnSuccess: false }),
      { wrapper }
    );

    result.current.mutate(userId);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should show error toast on failure', async () => {
    const userId = 'user_1';
    const error = new Error('Delete failed');
    vi.mocked(UserService.deleteUser).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteUser(), { wrapper });

    result.current.mutate(userId);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // The hook extracts the error message from the Error object
    expect(mockShowToast).toHaveBeenCalledWith('Delete failed', 'error');
  });

  it('should show error message from error object', async () => {
    const userId = 'user_1';
    const error = { message: 'Custom error message' };
    vi.mocked(UserService.deleteUser).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteUser(), { wrapper });

    result.current.mutate(userId);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockShowToast).toHaveBeenCalledWith('Custom error message', 'error');
  });
});
