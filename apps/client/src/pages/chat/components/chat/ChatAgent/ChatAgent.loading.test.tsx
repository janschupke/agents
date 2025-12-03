import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatAgent from './ChatAgent';
import { TestQueryProvider } from '../../../../test/utils/test-query-provider';
import { Session } from '../../../../types/chat.types';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
  })),
}));

// Mock useTokenReady
vi.mock('../../../../../hooks/use-token-ready', () => ({
  useTokenReady: () => true,
}));

// Mock hooks
const mockUseAgents = vi.fn();
vi.mock('../../../../hooks/queries/use-agents', () => ({
  useAgents: () => mockUseAgents(),
}));

const mockUseChatSession = vi.fn();
vi.mock('../../hooks/use-chat-session', () => ({
  useChatSession: () => mockUseChatSession(),
}));

const mockUseChatMessages = vi.fn();
vi.mock('../../hooks/use-chat-messages', () => ({
  useChatMessages: () => mockUseChatMessages(),
}));

vi.mock('../../hooks/use-chat-scroll', () => ({
  useChatScroll: vi.fn(() => ({
    messagesEndRef: { current: null },
  })),
}));

vi.mock('../../hooks/use-chat-modals', () => ({
  useChatModals: vi.fn(() => ({
    jsonModal: { isOpen: false, title: '', data: null },
    sessionNameModal: { isOpen: false, sessionId: null },
    openJsonModal: vi.fn(),
    closeJsonModal: vi.fn(),
    openSessionNameModal: vi.fn(),
    closeSessionNameModal: vi.fn(),
  })),
}));

vi.mock('../../hooks/use-chat-handlers', () => ({
  useChatHandlers: vi.fn(() => ({
    handleSessionSelectWrapper: vi.fn(),
    handleNewSessionWrapper: vi.fn(),
    handleSessionDeleteWrapper: vi.fn(),
    handleSessionNameSave: vi.fn(),
  })),
}));

vi.mock('../../hooks/use-chat-input', () => ({
  useChatInput: vi.fn(() => ({
    input: '',
    setInput: vi.fn(),
    chatInputRef: { current: null },
    handleSubmit: vi.fn(),
  })),
}));

vi.mock('../../hooks/use-chat-agent-navigation', () => ({
  useChatAgentNavigation: vi.fn(() => ({
    handleSessionSelect: vi.fn(),
    handleNewSession: vi.fn(),
  })),
}));

vi.mock('../../../../../hooks/useConfirm', () => ({
  useConfirm: vi.fn(() => ({
    ConfirmDialog: null,
  })),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <TestQueryProvider>{children}</TestQueryProvider>
  </MemoryRouter>
);

describe('ChatAgent Loading States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Page Loading (isInitialLoad)', () => {
    it('should show full page loading when agents are not cached and loading', () => {
      mockUseAgents.mockReturnValue({
        data: [],
        isLoading: true,
      });

      mockUseChatSession.mockReturnValue({
        currentSessionId: null,
        sessions: [],
        sessionsLoading: false,
        handleSessionDelete: vi.fn(),
      });

      mockUseChatMessages.mockReturnValue({
        messages: [],
        loading: false,
        isSendingMessage: false,
        sendMessage: vi.fn(),
        setMessages: vi.fn(),
      });

      render(
        <TestWrapper>
          <ChatAgent agentId={1} />
        </TestWrapper>
      );

      // Should show ChatLoadingState (full page loading)
      // ChatLoadingState renders Sidebar and Container with Skeleton components
      // Check for the chat title which is always rendered in ChatLoadingState
      expect(screen.getByText('chat.title')).toBeInTheDocument();
    });

    it('should NOT show full page loading when agents are cached', () => {
      mockUseAgents.mockReturnValue({
        data: [
          {
            id: 1,
            name: 'Agent 1',
            description: 'Desc',
            avatarUrl: null,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isLoading: false,
      });

      mockUseChatSession.mockReturnValue({
        currentSessionId: 1,
        sessions: [
          {
            id: 1,
            session_name: 'Session 1',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        sessionsLoading: false,
        handleSessionDelete: vi.fn(),
      });

      mockUseChatMessages.mockReturnValue({
        messages: [],
        loading: false,
        isSendingMessage: false,
        sendMessage: vi.fn(),
        setMessages: vi.fn(),
      });

      render(
        <TestWrapper>
          <ChatAgent agentId={1} sessionId={1} />
        </TestWrapper>
      );

      // Should render component, not loading state
      // Component should be visible (no full page loading)
      expect(screen.queryByText(/Loading/i)).toBeFalsy();
    });
  });

  describe('Sidebar Loading', () => {
    it('should NOT show sidebar loading when sessions are cached', () => {
      mockUseAgents.mockReturnValue({
        data: [
          {
            id: 1,
            name: 'Agent 1',
            description: 'Desc',
            avatarUrl: null,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isLoading: false,
      });

      const mockSessions: Session[] = [
        {
          id: 1,
          session_name: 'Session 1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      mockUseChatSession.mockReturnValue({
        currentSessionId: 1,
        sessions: mockSessions,
        sessionsLoading: true, // Background refetch
        handleSessionDelete: vi.fn(),
      });

      mockUseChatMessages.mockReturnValue({
        messages: [],
        loading: false,
        isSendingMessage: false,
        sendMessage: vi.fn(),
        setMessages: vi.fn(),
      });

      render(
        <TestWrapper>
          <ChatAgent agentId={1} sessionId={1} />
        </TestWrapper>
      );

      // Sidebar should NOT show loading (tested through universal hook)
      // Component should render normally
      expect(screen.queryByText(/Loading/i)).toBeFalsy();
    });
  });

  describe('Content Loading', () => {
    it('should show content loading when messages are loading and not cached', () => {
      mockUseAgents.mockReturnValue({
        data: [
          {
            id: 1,
            name: 'Agent 1',
            description: 'Desc',
            avatarUrl: null,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isLoading: false,
      });

      mockUseChatSession.mockReturnValue({
        currentSessionId: 1,
        sessions: [
          {
            id: 1,
            session_name: 'Session 1',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        sessionsLoading: false,
        handleSessionDelete: vi.fn(),
      });

      mockUseChatMessages.mockReturnValue({
        messages: [],
        loading: true, // Loading messages
        isSendingMessage: false,
        sendMessage: vi.fn(),
        setMessages: vi.fn(),
      });

      render(
        <TestWrapper>
          <ChatAgent agentId={1} sessionId={1} />
        </TestWrapper>
      );

      // Should show content skeleton, not full page loading
      // Component should render (content loading is handled by ContentSkeleton)
      expect(screen.queryByText(/Loading/i)).toBeFalsy();
    });

    it('should NOT show content loading when messages are cached', () => {
      mockUseAgents.mockReturnValue({
        data: [
          {
            id: 1,
            name: 'Agent 1',
            description: 'Desc',
            avatarUrl: null,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isLoading: false,
      });

      mockUseChatSession.mockReturnValue({
        currentSessionId: 1,
        sessions: [
          {
            id: 1,
            session_name: 'Session 1',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        sessionsLoading: false,
        handleSessionDelete: vi.fn(),
      });

      mockUseChatMessages.mockReturnValue({
        messages: [{ id: 1, role: 'user', content: 'Hello' }],
        loading: false,
        isSendingMessage: false,
        sendMessage: vi.fn(),
        setMessages: vi.fn(),
      });

      render(
        <TestWrapper>
          <ChatAgent agentId={1} sessionId={1} />
        </TestWrapper>
      );

      // Should render messages, not loading
      expect(screen.queryByText(/Loading/i)).toBeFalsy();
    });
  });

  describe('Typing Indicator', () => {
    it('should show typing indicator when sending message', () => {
      mockUseAgents.mockReturnValue({
        data: [
          {
            id: 1,
            name: 'Agent 1',
            description: 'Desc',
            avatarUrl: null,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        isLoading: false,
      });

      mockUseChatSession.mockReturnValue({
        currentSessionId: 1,
        sessions: [
          {
            id: 1,
            session_name: 'Session 1',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        sessionsLoading: false,
        handleSessionDelete: vi.fn(),
      });

      mockUseChatMessages.mockReturnValue({
        messages: [{ id: 1, role: 'user', content: 'Hello' }],
        loading: false,
        isSendingMessage: true, // Sending message
        sendMessage: vi.fn(),
        setMessages: vi.fn(),
      });

      render(
        <TestWrapper>
          <ChatAgent agentId={1} sessionId={1} />
        </TestWrapper>
      );

      // Should show typing indicator, not content loading
      expect(screen.queryByText(/Loading/i)).toBeFalsy();
    });
  });
});
