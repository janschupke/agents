import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSidebarLoadingState } from './use-sidebar-loading-state';
import { queryKeys } from './queries/query-keys';
import { Agent, Session } from '../types/chat.types';

describe('useSidebarLoadingState', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('agents type', () => {
    it('should return shouldShowLoading: false when cache has agents data', () => {
      const mockAgents: Agent[] = [
        {
          id: 1,
          name: 'Agent 1',
          description: 'Desc 1',
          avatarUrl: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      queryClient.setQueryData(queryKeys.agents.list(), mockAgents);

      const { result } = renderHook(
        () => useSidebarLoadingState({ type: 'agents', isLoading: true }),
        { wrapper }
      );

      expect(result.current.shouldShowLoading).toBe(false);
    });

    it('should return shouldShowLoading: true when cache has no agents and isLoading is true', () => {
      const { result } = renderHook(
        () => useSidebarLoadingState({ type: 'agents', isLoading: true }),
        { wrapper }
      );

      expect(result.current.shouldShowLoading).toBe(true);
    });

    it('should return shouldShowLoading: false when cache has no agents but isLoading is false', () => {
      const { result } = renderHook(
        () => useSidebarLoadingState({ type: 'agents', isLoading: false }),
        { wrapper }
      );

      expect(result.current.shouldShowLoading).toBe(false);
    });

    it('should return shouldShowLoading: false when cache has agents even if isLoading is true (background refetch)', () => {
      const mockAgents: Agent[] = [
        {
          id: 1,
          name: 'Agent 1',
          description: 'Desc 1',
          avatarUrl: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      queryClient.setQueryData(queryKeys.agents.list(), mockAgents);

      const { result } = renderHook(
        () => useSidebarLoadingState({ type: 'agents', isLoading: true }),
        { wrapper }
      );

      expect(result.current.shouldShowLoading).toBe(false);
    });
  });

  describe('sessions type', () => {
    const agentId = 1;

    it('should return shouldShowLoading: false when cache has sessions data', () => {
      const mockSessions: Session[] = [
        {
          id: 1,
          session_name: 'Session 1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      queryClient.setQueryData(
        queryKeys.agents.sessions(agentId),
        mockSessions
      );

      const { result } = renderHook(
        () =>
          useSidebarLoadingState({
            type: 'sessions',
            agentId,
            isLoading: true,
          }),
        { wrapper }
      );

      expect(result.current.shouldShowLoading).toBe(false);
    });

    it('should return shouldShowLoading: true when cache has no sessions and isLoading is true', () => {
      const { result } = renderHook(
        () =>
          useSidebarLoadingState({
            type: 'sessions',
            agentId,
            isLoading: true,
          }),
        { wrapper }
      );

      expect(result.current.shouldShowLoading).toBe(true);
    });

    it('should return shouldShowLoading: false when cache has no sessions but isLoading is false', () => {
      const { result } = renderHook(
        () =>
          useSidebarLoadingState({
            type: 'sessions',
            agentId,
            isLoading: false,
          }),
        { wrapper }
      );

      expect(result.current.shouldShowLoading).toBe(false);
    });

    it('should return shouldShowLoading: false when agentId is null', () => {
      const { result } = renderHook(
        () =>
          useSidebarLoadingState({
            type: 'sessions',
            agentId: null,
            isLoading: true,
          }),
        { wrapper }
      );

      expect(result.current.shouldShowLoading).toBe(false);
    });

    it('should check cache for correct agentId', () => {
      const agent1Sessions: Session[] = [
        {
          id: 1,
          session_name: 'Session 1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      const agent2Sessions: Session[] = [
        {
          id: 2,
          session_name: 'Session 2',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      queryClient.setQueryData(queryKeys.agents.sessions(1), agent1Sessions);
      queryClient.setQueryData(queryKeys.agents.sessions(2), agent2Sessions);

      // Check agent 1 - should have cached data
      const { result: result1 } = renderHook(
        () =>
          useSidebarLoadingState({
            type: 'sessions',
            agentId: 1,
            isLoading: true,
          }),
        { wrapper }
      );
      expect(result1.current.shouldShowLoading).toBe(false);

      // Check agent 3 - should not have cached data
      const { result: result3 } = renderHook(
        () =>
          useSidebarLoadingState({
            type: 'sessions',
            agentId: 3,
            isLoading: true,
          }),
        { wrapper }
      );
      expect(result3.current.shouldShowLoading).toBe(true);
    });

    it('should return shouldShowLoading: false when cache has sessions even if isLoading is true (background refetch)', () => {
      const mockSessions: Session[] = [
        {
          id: 1,
          session_name: 'Session 1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      queryClient.setQueryData(
        queryKeys.agents.sessions(agentId),
        mockSessions
      );

      const { result } = renderHook(
        () =>
          useSidebarLoadingState({
            type: 'sessions',
            agentId,
            isLoading: true,
          }),
        { wrapper }
      );

      expect(result.current.shouldShowLoading).toBe(false);
    });
  });
});
