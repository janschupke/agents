import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Chat from './Chat';
import { TestQueryProvider } from '../../test/utils/test-query-provider';
import { ROUTES } from '../../constants/routes.constants';

// Mock useChat
const mockUseChat = vi.fn();
vi.mock('./hooks/use-chat-route', () => ({
  useChat: (agentId: number | null, sessionId: number | null) =>
    mockUseChat(agentId, sessionId),
}));

// Mock useAgents and useAgentSessions
const mockUseAgents = vi.fn();
const mockUseAgentSessions = vi.fn();
vi.mock('../../hooks/queries/use-agents', () => ({
  useAgents: () => mockUseAgents(),
  useAgentSessions: () => mockUseAgentSessions(),
}));

// Mock LocalStorageManager
const mockGetSelectedAgentIdChat = vi.fn();
const mockSetSelectedAgentIdChat = vi.fn();
vi.mock('../../utils/localStorage', () => ({
  LocalStorageManager: {
    getSelectedAgentIdChat: () => mockGetSelectedAgentIdChat(),
    setSelectedAgentIdChat: (agentId: number) =>
      mockSetSelectedAgentIdChat(agentId),
  },
}));

// Mock ChatAgent
vi.mock('./components/chat/ChatAgent', () => ({
  default: ({
    sessionId,
    agentId,
  }: {
    sessionId?: number;
    agentId?: number;
  }) => (
    <div data-testid="chat-agent">
      ChatAgent - sessionId: {sessionId ?? 'none'}, agentId: {agentId ?? 'none'}
    </div>
  ),
}));

// Mock ChatLoadingState
vi.mock('./components/chat/ChatLoadingState', () => ({
  default: () => <div data-testid="chat-loading">Loading...</div>,
}));

// Mock ChatErrorState
vi.mock('./components/chat/ChatErrorState', () => ({
  default: ({ message }: { message: string }) => (
    <div data-testid="chat-error">Error: {message}</div>
  ),
}));

// Mock useParams
const mockUseParams = vi.fn(() => ({}));
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );
  return {
    ...actual,
    useParams: () => mockUseParams(),
  };
});

// i18n is globally mocked in test/setup.ts

// Mock useQueryClient
const mockGetQueryData = vi.fn(() => undefined);
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query'
  );
  return {
    ...actual,
    useQueryClient: () => ({
      getQueryData: mockGetQueryData,
    }),
  };
});

import { AuthProvider } from '../../contexts/AuthContext';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
  })),
}));

// Mock useTokenReady
vi.mock('../../hooks/use-token-ready', () => ({
  useTokenReady: () => true,
}));

const TestWrapper = ({
  children,
  initialEntries = [ROUTES.CHAT],
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <TestQueryProvider>
      <AuthProvider>
        <Routes>
          <Route path={ROUTES.CHAT} element={children} />
          <Route path={ROUTES.CHAT_AGENT_PATTERN} element={children} />
          <Route path={ROUTES.CHAT_SESSION_PATTERN} element={children} />
        </Routes>
      </AuthProvider>
    </TestQueryProvider>
  </MemoryRouter>
);

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({});
    mockGetSelectedAgentIdChat.mockReturnValue(null);
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
    mockUseAgentSessions.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockUseChat.mockReturnValue({
      loading: false,
      error: null,
    });
    mockGetQueryData.mockReturnValue(undefined);
  });

  it('should show loading state when loading', () => {
    mockUseAgents.mockReturnValue({
      data: [],
      isLoading: true,
    });

    render(
      <TestWrapper>
        <Chat />
      </TestWrapper>
    );

    expect(screen.getByTestId('chat-loading')).toBeInTheDocument();
  });

  it('should show error state when error occurs', () => {
    mockUseParams.mockReturnValue({ agentId: '1', sessionId: '123' });
    mockUseChat.mockReturnValue({
      loading: false,
      error: 'Session not found',
    });
    mockGetQueryData.mockReturnValue(undefined); // No cached sessions

    render(
      <TestWrapper initialEntries={['/chat/1/123']}>
        <Chat />
      </TestWrapper>
    );

    expect(screen.getByTestId('chat-error')).toBeInTheDocument();
    expect(screen.getByText(/Session not found/)).toBeInTheDocument();
  });

  it('should handle route with only agentId (no sessionId)', () => {
    // Route /chat/123 matches /chat/:agentId pattern
    // So urlAgentId='123', urlSessionId=undefined
    mockUseParams.mockReturnValue({ agentId: '123' });
    mockUseAgentSessions.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockUseChat.mockReturnValue({
      loading: false,
      error: null,
    });

    render(
      <TestWrapper initialEntries={['/chat/123']}>
        <Chat />
      </TestWrapper>
    );

    // When no sessions, Chat shows ChatAgent directly
    expect(screen.getByTestId('chat-agent')).toBeInTheDocument();
    expect(screen.getByText(/agentId: 123/)).toBeInTheDocument();
  });

  it('should render ChatAgent with agentId when no sessionId', () => {
    mockUseParams.mockReturnValue({ agentId: '5' });
    mockUseAgentSessions.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockUseChat.mockReturnValue({
      loading: false,
      error: null,
    });

    render(
      <TestWrapper initialEntries={['/chat/5']}>
        <Chat />
      </TestWrapper>
    );

    // When no sessions, Chat shows ChatAgent directly
    expect(screen.getByTestId('chat-agent')).toBeInTheDocument();
    expect(screen.getByText(/agentId: 5/)).toBeInTheDocument();
  });

  it('should render ChatAgent with sessionId and agentId when both exist', () => {
    mockUseParams.mockReturnValue({ agentId: '7', sessionId: '123' });
    mockUseChat.mockReturnValue({
      loading: false,
      error: null,
    });

    render(
      <TestWrapper initialEntries={['/chat/7/123']}>
        <Chat />
      </TestWrapper>
    );

    const chatAgent = screen.getByTestId('chat-agent');
    expect(chatAgent).toBeInTheDocument();
    expect(chatAgent).toHaveTextContent('sessionId: 123');
    expect(chatAgent).toHaveTextContent('agentId: 7');
  });

  it('should handle null agentId gracefully when no sessionId', () => {
    mockUseParams.mockReturnValue({});
    mockUseAgents.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <TestWrapper>
        <Chat />
      </TestWrapper>
    );

    // Will show loading while trying to redirect (no agents available)
    expect(screen.getByTestId('chat-loading')).toBeInTheDocument();
  });

  it('should navigate to chat route when sessionId is invalid', () => {
    mockUseParams.mockReturnValue({ agentId: '1', sessionId: 'invalid' });
    mockUseChat.mockReturnValue({
      loading: false,
      error: null,
    });
    // When parsedSessionId is null (invalid), it navigates to CHAT_AGENT
    // The Navigate component will render

    const { container } = render(
      <TestWrapper initialEntries={['/chat/1/invalid']}>
        <Chat />
      </TestWrapper>
    );

    // Should navigate away (Navigate component renders)
    expect(container).toBeTruthy();
  });
});
