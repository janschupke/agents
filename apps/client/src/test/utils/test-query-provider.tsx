import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ReactNode, useRef, createContext, useContext } from 'react';
import { createTestQueryClient } from './test-query-client';

interface TestQueryProviderProps {
  children: ReactNode;
}

// Context to expose QueryClient for tests
const QueryClientContext = createContext<QueryClient | null>(null);

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
    <QueryClientContext.Provider value={queryClientRef.current}>
      <QueryClientProvider client={queryClientRef.current}>
        {children}
      </QueryClientProvider>
    </QueryClientContext.Provider>
  );
}

/**
 * Hook to get the QueryClient instance in tests
 */
export function useTestQueryClient(): QueryClient {
  const client = useContext(QueryClientContext);
  if (!client) {
    throw new Error('useTestQueryClient must be used within TestQueryProvider');
  }
  return client;
}
