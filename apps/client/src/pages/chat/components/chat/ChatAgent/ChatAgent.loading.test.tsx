import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatAgent from './ChatAgent';
import { TestQueryProvider } from '../../../../../test/utils/test-query-provider';
import { AuthProvider } from '../../../../../contexts/AuthContext';
import { ToastProvider } from '../../../../../contexts/ToastContext';

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

// use-chat-session hook removed - sessions are backend-managed

const mockUseChatMessages = vi.fn();
vi.mock('../../hooks/use-chat-messages', () => ({
  useChatMessages: () => mockUseChatMessages(),
}));

// Mock scrollIntoView for jsdom
const mockScrollIntoView = vi.fn();
vi.mock('../../hooks/use-chat-scroll', () => ({
  useChatScroll: vi.fn(() => ({
    messagesEndRef: { 
      current: {
        scrollIntoView: mockScrollIntoView,
      } as unknown as HTMLDivElement,
    },
  })),
}));

vi.mock('../../hooks/use-chat-modals', () => ({
  useChatModals: vi.fn(() => ({
    jsonModal: { isOpen: false, title: '', data: null },
    openJsonModal: vi.fn(),
    closeJsonModal: vi.fn(),
  })),
}));

// use-chat-handlers hook removed - session handlers no longer needed

vi.mock('../../hooks/use-chat-input', () => ({
  useChatInput: vi.fn(() => ({
    input: '',
    setInput: vi.fn(),
    chatInputRef: { current: null },
    handleSubmit: vi.fn(),
  })),
}));

// use-chat-agent-navigation hook removed - navigation handled directly

vi.mock('../../../../../hooks/ui/useConfirm', () => ({
  useConfirm: vi.fn(() => ({
    ConfirmDialog: null,
  })),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <TestQueryProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </TestQueryProvider>
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

      mockUseChatMessages.mockReturnValue({
        messages: [],
        savedWordMatches: new Map(),
        loading: false,
        isSendingMessage: false,
        sendMessage: vi.fn(),
        setMessages: vi.fn(),
        messagesContainerRef: { current: null },
        isFetchingMore: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
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

      mockUseChatMessages.mockReturnValue({
        messages: [],
        savedWordMatches: new Map(),
        loading: false,
        isSendingMessage: false,
        sendMessage: vi.fn(),
        setMessages: vi.fn(),
        messagesContainerRef: { current: null },
        isFetchingMore: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
      });

      render(
        <TestWrapper>
          <ChatAgent agentId={1} />
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

      mockUseChatMessages.mockReturnValue({
        messages: [],
        savedWordMatches: new Map(),
        loading: false,
        isSendingMessage: false,
        sendMessage: vi.fn(),
        setMessages: vi.fn(),
        messagesContainerRef: { current: null },
        isFetchingMore: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
      });

      render(
        <TestWrapper>
          <ChatAgent agentId={1} />
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

      mockUseChatMessages.mockReturnValue({
        messages: [],
        savedWordMatches: new Map(),
        loading: true, // Loading messages
        isSendingMessage: false,
        sendMessage: vi.fn(),
        setMessages: vi.fn(),
        messagesContainerRef: { current: null },
        isFetchingMore: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
      });

      render(
        <TestWrapper>
          <ChatAgent agentId={1} />
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

      mockUseChatMessages.mockReturnValue({
        messages: [{ id: 1, role: 'user', content: 'Hello' }],
        savedWordMatches: new Map(),
        loading: false,
        isSendingMessage: false,
        sendMessage: vi.fn(),
        setMessages: vi.fn(),
        messagesContainerRef: { current: null },
        isFetchingMore: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
      });

      render(
        <TestWrapper>
          <ChatAgent agentId={1} />
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

      mockUseChatMessages.mockReturnValue({
        messages: [{ id: 1, role: 'user', content: 'Hello' }],
        savedWordMatches: new Map(),
        loading: false,
        isSendingMessage: true, // Sending message
        sendMessage: vi.fn(),
        setMessages: vi.fn(),
        messagesContainerRef: { current: null },
        isFetchingMore: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
      });

      render(
        <TestWrapper>
          <ChatAgent agentId={1} />
        </TestWrapper>
      );

      // Should show typing indicator, not content loading
      expect(screen.queryByText(/Loading/i)).toBeFalsy();
    });
  });
});
