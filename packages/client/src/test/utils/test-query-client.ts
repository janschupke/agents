import { QueryClient } from '@tanstack/react-query';

/**
 * Create a new QueryClient for each test to avoid state leakage
 * This ensures tests are isolated and don't affect each other
 * Optimized for fast test execution
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
        gcTime: 0, // Immediately garbage collect unused queries
        staleTime: 0, // Always consider data stale
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        networkMode: 'always', // Don't wait for network status
      },
      mutations: {
        retry: false,
        networkMode: 'always',
      },
    },
  });
}
