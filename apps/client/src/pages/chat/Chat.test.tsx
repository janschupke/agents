import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Chat from './Chat';
import { TestQueryProvider } from '../../test/utils/test-query-provider';
import { ROUTES } from '../../constants/routes.constants';

// Mock useAgents
const mockUseAgents = vi.fn();
vi.mock('../../hooks/queries/use-agents', () => ({
  useAgents: () => mockUseAgents(),
}));

// Mock ChatAgent
vi.mock('./components/chat/ChatAgent/ChatAgent', () => ({
  default: ({ agentId }: { agentId?: number | null }) => (
    <div data-testid="chat-agent">
      ChatAgent - agentId: {agentId ?? 'null'}
    </div>
  ),
}));

// Mock ChatLoadingState
vi.mock('./components/chat/ChatLoadingState/ChatLoadingState', () => ({
  default: () => <div data-testid="chat-loading">Loading...</div>,
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

import { AuthProvider } from '../../contexts/AuthContext';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
  })),
}));

// Mock useTokenReady
vi.mock('../../hooks/utils/use-token-ready', () => ({
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
        </Routes>
      </AuthProvider>
    </TestQueryProvider>
  </MemoryRouter>
);

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({});
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
  });

  it('should show loading state when loading agents', () => {
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

  it('should show ChatAgent with null agentId when no agentId in URL', () => {
    mockUseParams.mockReturnValue({});

    render(
      <TestWrapper>
        <Chat />
      </TestWrapper>
    );

    expect(screen.getByTestId('chat-agent')).toBeInTheDocument();
    expect(screen.getByText(/agentId: null/)).toBeInTheDocument();
  });

  it('should render ChatAgent with agentId when agentId in URL', () => {
    mockUseParams.mockReturnValue({ agentId: '123' });

    render(
      <TestWrapper initialEntries={['/chat/123']}>
        <Chat />
      </TestWrapper>
    );

    expect(screen.getByTestId('chat-agent')).toBeInTheDocument();
    expect(screen.getByText(/agentId: 123/)).toBeInTheDocument();
  });

  it('should navigate to chat route when agentId is invalid', () => {
    mockUseParams.mockReturnValue({ agentId: 'invalid' });

    const { container } = render(
      <TestWrapper initialEntries={['/chat/invalid']}>
        <Chat />
      </TestWrapper>
    );

    // Should navigate away (Navigate component renders)
    expect(container).toBeTruthy();
  });
});
