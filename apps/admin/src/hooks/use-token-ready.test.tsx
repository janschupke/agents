import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTokenReady } from './use-token-ready';
import { useUser } from '@clerk/clerk-react';

vi.mock('@clerk/clerk-react');

describe('useTokenReady', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return false when user is not signed in', () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    } as ReturnType<typeof useUser>);

    const { result } = renderHook(() => useTokenReady());

    expect(result.current).toBe(false);
  });

  it('should return false when user data is not loaded', () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: false,
      isLoaded: false,
    } as unknown as ReturnType<typeof useUser>);

    const { result } = renderHook(() => useTokenReady());

    expect(result.current).toBe(false);
  });

  it('should return false initially when user is signed in and loaded', () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
    } as ReturnType<typeof useUser>);

    const { result } = renderHook(() => useTokenReady());

    expect(result.current).toBe(false);
  });

  it('should return true after timeout when user is signed in and loaded', async () => {
    vi.mocked(useUser).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
    } as ReturnType<typeof useUser>);

    const { result } = renderHook(() => useTokenReady());

    expect(result.current).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe(true);
  });

  it('should reset to false when user signs out', async () => {
    const { result, rerender } = renderHook(
      ({ isSignedIn, isLoaded }) => {
        vi.mocked(useUser).mockReturnValue({
          isSignedIn,
          isLoaded,
        } as ReturnType<typeof useUser>);
        return useTokenReady();
      },
      {
        initialProps: { isSignedIn: true, isLoaded: true },
      }
    );

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe(true);

    await act(async () => {
      rerender({ isSignedIn: false, isLoaded: true });
    });

    expect(result.current).toBe(false);
  });
});
