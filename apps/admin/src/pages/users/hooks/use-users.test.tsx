import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUsers, useCurrentUser } from './use-users';
import { UserService } from '../../../services/user.service';
import { useUser } from '@clerk/clerk-react';
import { useTokenReady } from '../../../hooks/use-token-ready';
import { TestQueryProvider } from '../../../test/utils/test-query-provider';
import type { User } from '../../../types/user.types';

vi.mock('../../../services/user.service');
vi.mock('@clerk/clerk-react');
vi.mock('../../../hooks/use-token-ready');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
    } as ReturnType<typeof useUser>);
    vi.mocked(useTokenReady).mockReturnValue(true);
  });

  it('should fetch users when enabled', async () => {
    const mockUsers: User[] = [
      {
        id: 'user_1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: null,
        roles: ['user'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    vi.mocked(UserService.getAllUsers).mockResolvedValue(mockUsers);

    const { result } = renderHook(() => useUsers(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUsers);
    expect(UserService.getAllUsers).toHaveBeenCalledTimes(1);
  });

  it('should not fetch users when not signed in', () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    } as ReturnType<typeof useUser>);

    renderHook(() => useUsers(), { wrapper });

    expect(UserService.getAllUsers).not.toHaveBeenCalled();
  });

  it('should not fetch users when not loaded', () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: false,
      isLoaded: false,
    } as unknown as ReturnType<typeof useUser>);

    renderHook(() => useUsers(), { wrapper });

    expect(UserService.getAllUsers).not.toHaveBeenCalled();
  });

  it('should not fetch users when token is not ready', () => {
    vi.mocked(useTokenReady).mockReturnValue(false);

    renderHook(() => useUsers(), { wrapper });

    expect(UserService.getAllUsers).not.toHaveBeenCalled();
  });
});

describe('useCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
    } as ReturnType<typeof useUser>);
    vi.mocked(useTokenReady).mockReturnValue(true);
  });

  it('should fetch current user when enabled', async () => {
    const mockUser: User = {
      id: 'user_1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      imageUrl: null,
      roles: ['user'],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    vi.mocked(UserService.getCurrentUser).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUser);
    expect(UserService.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('should not fetch current user when not signed in', () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    } as ReturnType<typeof useUser>);

    renderHook(() => useCurrentUser(), { wrapper });

    expect(UserService.getCurrentUser).not.toHaveBeenCalled();
  });

  it('should not fetch current user when not loaded', () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: false,
      isLoaded: false,
    } as unknown as ReturnType<typeof useUser>);

    renderHook(() => useCurrentUser(), { wrapper });

    expect(UserService.getCurrentUser).not.toHaveBeenCalled();
  });

  it('should not fetch current user when token is not ready', () => {
    vi.mocked(useTokenReady).mockReturnValue(false);

    renderHook(() => useCurrentUser(), { wrapper });

    expect(UserService.getCurrentUser).not.toHaveBeenCalled();
  });
});
