import { QueryClient } from '@tanstack/react-query';
import {
  DEFAULT_STALE_TIME,
  DEFAULT_GC_TIME,
} from '../constants/cache.constants';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_GC_TIME,
      refetchOnWindowFocus: false, // Don't refetch on window focus to reduce calls
      refetchOnMount: false, // Don't refetch on mount if data is fresh
      retry: 2,
    },
  },
});
