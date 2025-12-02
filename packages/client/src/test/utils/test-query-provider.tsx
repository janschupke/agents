import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ReactNode, useRef } from 'react';
import { createTestQueryClient } from './test-query-client';

interface TestQueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider for tests that creates a fresh QueryClient for each test
 * This prevents state leakage between tests
 * Uses useRef to ensure the same QueryClient instance is used throughout the component lifecycle
 */
export function TestQueryProvider({ children }: TestQueryProviderProps) {
  const queryClientRef = useRef<QueryClient | null>(null);

  if (!queryClientRef.current) {
    queryClientRef.current = createTestQueryClient();
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
    </QueryClientProvider>
  );
}
