import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChatLoadingState } from './use-chat-loading-state';
import { queryKeys } from '../../../hooks/queries/query-keys';
import { Agent, Session } from '../../../types/chat.types';

// Mock useAgents to avoid actual API calls
vi.mock('../../../hooks/queries/use-agents', () => ({
  useAgents: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

describe('useChatLoadingState', () => {
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

  describe('isInitialLoad', () => {
    it('should be true when no cached agents and agents are loading', () => {
      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: null,
            sessionId: null,
            agentsLoading: true,
            sessionsLoading: false,
            messagesLoading: false,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.isInitialLoad).toBe(true);
    });

    it('should be true when no cached sessions and sessions are loading', () => {
      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: null,
            agentsLoading: false,
            sessionsLoading: true,
            messagesLoading: false,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.isInitialLoad).toBe(true);
    });

    it('should be false when agents are cached', () => {
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
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: null,
            agentsLoading: true,
            sessionsLoading: false,
            messagesLoading: false,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.isInitialLoad).toBe(false);
    });

    it('should be false when sessions are cached', () => {
      const mockSessions: Session[] = [
        {
          id: 1,
          session_name: 'Session 1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      queryClient.setQueryData(queryKeys.agents.sessions(1), mockSessions);

      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: null,
            agentsLoading: false,
            sessionsLoading: true,
            messagesLoading: false,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.isInitialLoad).toBe(false);
    });

    it('should be false when messages are loading (should not trigger full page load)', () => {
      const mockAgents: Agent[] = [
        {
          id: 1,
          name: 'Agent 1',
          description: 'Desc 1',
          avatarUrl: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      const mockSessions: Session[] = [
        {
          id: 1,
          session_name: 'Session 1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      queryClient.setQueryData(queryKeys.agents.list(), mockAgents);
      queryClient.setQueryData(queryKeys.agents.sessions(1), mockSessions);

      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: 1,
            agentsLoading: false,
            sessionsLoading: false,
            messagesLoading: true,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.isInitialLoad).toBe(false);
    });
  });

  describe('sidebarLoading', () => {
    it('should be true when agents are loading and not cached', () => {
      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: null,
            sessionId: null,
            agentsLoading: true,
            sessionsLoading: false,
            messagesLoading: false,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.sidebarLoading).toBe(true);
    });

    it('should be true when sessions are loading and not cached', () => {
      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: null,
            agentsLoading: false,
            sessionsLoading: true,
            messagesLoading: false,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.sidebarLoading).toBe(true);
    });

    it('should be false when agents are cached even if isLoading is true', () => {
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
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: null,
            agentsLoading: true,
            sessionsLoading: false,
            messagesLoading: false,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.sidebarLoading).toBe(false);
    });

    it('should be false when sessions are cached even if isLoading is true', () => {
      const mockSessions: Session[] = [
        {
          id: 1,
          session_name: 'Session 1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      queryClient.setQueryData(queryKeys.agents.sessions(1), mockSessions);

      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: null,
            agentsLoading: false,
            sessionsLoading: true,
            messagesLoading: false,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.sidebarLoading).toBe(false);
    });

    it('should be false when both agents and sessions are cached', () => {
      const mockAgents: Agent[] = [
        {
          id: 1,
          name: 'Agent 1',
          description: 'Desc 1',
          avatarUrl: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      const mockSessions: Session[] = [
        {
          id: 1,
          session_name: 'Session 1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      queryClient.setQueryData(queryKeys.agents.list(), mockAgents);
      queryClient.setQueryData(queryKeys.agents.sessions(1), mockSessions);

      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: 1,
            agentsLoading: true,
            sessionsLoading: true,
            messagesLoading: false,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.sidebarLoading).toBe(false);
    });
  });

  describe('containerLoading', () => {
    it('should be true when agents are loading and not cached', () => {
      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: null,
            sessionId: null,
            agentsLoading: true,
            sessionsLoading: false,
            messagesLoading: false,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.containerLoading).toBe(true);
    });

    it('should be false when agents are cached', () => {
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
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: null,
            agentsLoading: true,
            sessionsLoading: false,
            messagesLoading: false,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.containerLoading).toBe(false);
    });
  });

  describe('contentLoading', () => {
    it('should be true when messages are loading and not cached', () => {
      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: 1,
            agentsLoading: false,
            sessionsLoading: false,
            messagesLoading: true,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.contentLoading).toBe(true);
    });

    it('should be false when messages are cached', () => {
      const mockHistory = {
        agent: {
          id: 1,
          name: 'Agent 1',
          description: 'Desc 1',
          avatarUrl: null,
        },
        session: {
          id: 1,
          session_name: 'Session 1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        messages: [],
      };
      queryClient.setQueryData(queryKeys.chat.history(1, 1), mockHistory);

      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: 1,
            agentsLoading: false,
            sessionsLoading: false,
            messagesLoading: true,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.contentLoading).toBe(false);
    });

    it('should be false when sending message (should show typing indicator instead)', () => {
      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: 1,
            agentsLoading: false,
            sessionsLoading: false,
            messagesLoading: true,
            isSendingMessage: true,
          }),
        { wrapper }
      );

      expect(result.current.contentLoading).toBe(false);
    });

    it('should be false when sessionId is null', () => {
      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: null,
            agentsLoading: false,
            sessionsLoading: false,
            messagesLoading: true,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.contentLoading).toBe(false);
    });
  });

  describe('showTypingIndicator', () => {
    it('should be true when sending message', () => {
      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: 1,
            agentsLoading: false,
            sessionsLoading: false,
            messagesLoading: false,
            isSendingMessage: true,
          }),
        { wrapper }
      );

      expect(result.current.showTypingIndicator).toBe(true);
    });

    it('should be false when not sending message', () => {
      const { result } = renderHook(
        () =>
          useChatLoadingState({
            agentId: 1,
            sessionId: 1,
            agentsLoading: false,
            sessionsLoading: false,
            messagesLoading: false,
            isSendingMessage: false,
          }),
        { wrapper }
      );

      expect(result.current.showTypingIndicator).toBe(false);
    });
  });
});
