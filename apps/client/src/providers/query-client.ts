import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes - keep unused data in cache for 30 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus to reduce calls
      refetchOnMount: false, // Don't refetch on mount if data is fresh
      retry: 2,
    },
  },
});
