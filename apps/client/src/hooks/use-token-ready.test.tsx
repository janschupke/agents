import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTokenReady } from './use-token-ready';
import { tokenProvider } from '../services/token-provider';

// Mock AuthContext
const mockAuth = {
  isSignedIn: true,
  isLoaded: true,
};
const mockSetAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

describe('useTokenReady', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenProvider.clearTokenGetter();
  });

  afterEach(() => {
    tokenProvider.clearTokenGetter();
  });

  it('should return true when token provider is ready and user is signed in', async () => {
    tokenProvider.setTokenGetter(async () => 'test-token');

    const { result } = renderHook(() => useTokenReady());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should return false when user is not signed in', () => {
    mockAuth.isSignedIn = false;
    mockAuth.isLoaded = true;

    const { result } = renderHook(() => useTokenReady());

    expect(result.current).toBe(false);
  });

  it('should return false when auth is not loaded', () => {
    mockAuth.isSignedIn = true;
    mockAuth.isLoaded = false;

    const { result } = renderHook(() => useTokenReady());

    expect(result.current).toBe(false);
  });

  it('should wait for token provider to be ready', async () => {
    mockAuth.isSignedIn = true;
    mockAuth.isLoaded = true;

    // Token provider not ready initially
    const { result } = renderHook(() => useTokenReady());

    expect(result.current).toBe(false);

    // Set token provider ready
    tokenProvider.setTokenGetter(async () => 'test-token');

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should update when auth state changes', async () => {
    mockAuth.isSignedIn = false;
    mockAuth.isLoaded = false;

    const { result, rerender } = renderHook(() => useTokenReady());

    expect(result.current).toBe(false);

    // Update auth state
    mockAuth.isSignedIn = true;
    mockAuth.isLoaded = true;
    tokenProvider.setTokenGetter(async () => 'test-token');

    rerender();

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
