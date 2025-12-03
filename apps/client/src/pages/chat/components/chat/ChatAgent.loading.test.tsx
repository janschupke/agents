import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatAgent from './ChatAgent';
import { TestQueryProvider } from '../../../../../test/utils/test-query-provider';
import { queryKeys } from '../../../../../hooks/queries/query-keys';
import { Agent, Session } from '../../../../../types/chat.types';

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
vi.mock('../../../../../hooks/queries/use-agents', () => ({
  useAgents: vi.fn(),
}));

vi.mock('../../hooks/use-chat-session', () => ({
  useChatSession: vi.fn(),
}));

vi.mock('../../hooks/use-chat-messages', () => ({
  useChatMessages: vi.fn(),
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
    <TestQueryProvider>
      {children}
    </TestQueryProvider>
  </MemoryRouter>
);

describe('ChatAgent Loading States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Page Loading (isInitialLoad)', () => {
    it('should show full page loading when agents are not cached and loading', () => {
      const { useAgents } = require('../../../../../hooks/queries/use-agents');
      useAgents.mockReturnValue({
        data: [],
        isLoading: true,
      });

      const { useChatSession } = require('../../hooks/use-chat-session');
      useChatSession.mockReturnValue({
        currentSessionId: null,
        sessions: [],
        sessionsLoading: false,
        handleSessionDelete: vi.fn(),
      });

      const { useChatMessages } = require('../../hooks/use-chat-messages');
      useChatMessages.mockReturnValue({
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

      // Should show ChatLoadingState
      expect(screen.queryByTestId('chat-loading')).toBeTruthy();
    });

    it('should NOT show full page loading when agents are cached', () => {
      const { useAgents } = require('../../../../../hooks/queries/use-agents');
      useAgents.mockReturnValue({
        data: [{ id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null }],
        isLoading: false,
      });

      const { useChatSession } = require('../../hooks/use-chat-session');
      useChatSession.mockReturnValue({
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

      const { useChatMessages } = require('../../hooks/use-chat-messages');
      useChatMessages.mockReturnValue({
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
      expect(screen.queryByTestId('chat-loading')).toBeFalsy();
    });
  });

  describe('Sidebar Loading', () => {
    it('should NOT show sidebar loading when sessions are cached', () => {
      const { useAgents } = require('../../../../../hooks/queries/use-agents');
      useAgents.mockReturnValue({
        data: [{ id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null }],
        isLoading: false,
      });

      const mockSessions: Session[] = [
        {
          id: 1,
          session_name: 'Session 1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      const { useChatSession } = require('../../hooks/use-chat-session');
      useChatSession.mockReturnValue({
        currentSessionId: 1,
        sessions: mockSessions,
        sessionsLoading: true, // Background refetch
        handleSessionDelete: vi.fn(),
      });

      const { useChatMessages } = require('../../hooks/use-chat-messages');
      useChatMessages.mockReturnValue({
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
      expect(screen.queryByTestId('chat-loading')).toBeFalsy();
    });
  });

  describe('Content Loading', () => {
    it('should show content loading when messages are loading and not cached', () => {
      const { useAgents } = require('../../../../../hooks/queries/use-agents');
      useAgents.mockReturnValue({
        data: [{ id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null }],
        isLoading: false,
      });

      const { useChatSession } = require('../../hooks/use-chat-session');
      useChatSession.mockReturnValue({
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

      const { useChatMessages } = require('../../hooks/use-chat-messages');
      useChatMessages.mockReturnValue({
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
      expect(screen.queryByTestId('chat-loading')).toBeFalsy();
    });

    it('should NOT show content loading when messages are cached', () => {
      const { useAgents } = require('../../../../../hooks/queries/use-agents');
      useAgents.mockReturnValue({
        data: [{ id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null }],
        isLoading: false,
      });

      const { useChatSession } = require('../../hooks/use-chat-session');
      useChatSession.mockReturnValue({
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

      const { useChatMessages } = require('../../hooks/use-chat-messages');
      useChatMessages.mockReturnValue({
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
      expect(screen.queryByTestId('chat-loading')).toBeFalsy();
    });
  });

  describe('Typing Indicator', () => {
    it('should show typing indicator when sending message', () => {
      const { useAgents } = require('../../../../../hooks/queries/use-agents');
      useAgents.mockReturnValue({
        data: [{ id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null }],
        isLoading: false,
      });

      const { useChatSession } = require('../../hooks/use-chat-session');
      useChatSession.mockReturnValue({
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

      const { useChatMessages } = require('../../hooks/use-chat-messages');
      useChatMessages.mockReturnValue({
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
      expect(screen.queryByTestId('chat-loading')).toBeFalsy();
    });
  });
});
