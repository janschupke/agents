import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AgentConfig from './AgentConfig';
import { AppProvider } from '../../../../../contexts/AppContext';
import { AuthProvider } from '../../../../../contexts/AuthContext';
import { ToastProvider } from '../../../../../contexts/ToastContext';
import {
  TestQueryProvider,
  useTestQueryClient,
} from '../../../../../test/utils/test-query-provider';
import { queryKeys } from '../../../../../hooks/queries/query-keys';
import { AgentService } from '../../../../../services/agent/agent.service';
import { Agent } from '../../../../../types/chat.types';
import { ROUTES } from '../../../../../constants/routes.constants';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
  })),
}));

// Mock useTokenReady
vi.mock('../../../../../hooks/utils/use-token-ready', () => ({
  useTokenReady: () => true,
}));

// Mock AgentService
const { mockGetAllAgents, mockGetAgent, mockCreateAgent, mockUpdateAgent, mockDeleteAgent } = vi.hoisted(() => {
  const mockGetAllAgents = vi.fn();
  const mockGetAgent = vi.fn(() =>
    Promise.resolve({
      id: 1,
      name: 'Test Agent',
      description: 'Test',
      createdAt: '2024-01-01T00:00:00Z',
      configs: {
        temperature: 0.7,
        system_prompt: '',
        behavior_rules: [],
      },
    })
  );
  const mockCreateAgent = vi.fn();
  const mockUpdateAgent = vi.fn();
  const mockDeleteAgent = vi.fn();
  return { mockGetAllAgents, mockGetAgent, mockCreateAgent, mockUpdateAgent, mockDeleteAgent };
});

vi.mock('../../../../../services/agent/agent.service', () => ({
  AgentService: {
    getAllAgents: mockGetAllAgents,
    getAgent: mockGetAgent,
    createAgent: mockCreateAgent,
    updateAgent: mockUpdateAgent,
    deleteAgent: mockDeleteAgent,
  },
}));

// Mock SessionService
vi.mock('../../../../../services/chat/session/session.service', () => ({
  SessionService: {
    getSessions: vi.fn(() => Promise.resolve([])),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
const mockUseParams = vi.fn(() => ({}));
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  };
});

// Component to set up query data
const QueryDataSetup = ({
  children,
  initialAgents,
}: {
  children: React.ReactNode;
  initialAgents: Agent[];
}) => {
  const queryClient = useTestQueryClient();
  // Pre-populate query cache so component doesn't show loading state
  React.useEffect(() => {
    if (initialAgents.length > 0) {
      queryClient.setQueryData(queryKeys.agents.list(), initialAgents);
    }
  }, [queryClient, initialAgents]);
  return <>{children}</>;
};

// Test wrapper with all providers
const TestWrapper = ({
  children,
  initialEntries = [ROUTES.CONFIG],
  initialAgents = [],
}: {
  children: React.ReactNode;
  initialEntries?: string[];
  initialAgents?: Agent[];
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <TestQueryProvider>
      <QueryDataSetup initialAgents={initialAgents}>
        <AuthProvider>
          <AppProvider>
            <ToastProvider>
              <Routes>
                <Route path={ROUTES.CONFIG} element={children} />
                <Route
                  path={ROUTES.CONFIG_NEW}
                  element={<AgentConfig isNewAgent={true} />}
                />
              </Routes>
            </ToastProvider>
          </AppProvider>
        </AuthProvider>
      </QueryDataSetup>
    </TestQueryProvider>
  </MemoryRouter>
);

describe('AgentConfig', () => {

  const mockAgents: Agent[] = [
    {
      id: 1,
      name: 'Existing Agent 1',
      description: 'First agent',
      avatarUrl: null,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Existing Agent 2',
      description: 'Second agent',
      avatarUrl: null,
      createdAt: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockGetAllAgents.mockResolvedValue(mockAgents);
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({}); // No agentId in URL by default
  });

  it('should navigate to new agent route when clicking new agent button', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper initialAgents={mockAgents}>
        <AgentConfig />
      </TestWrapper>
    );

    // The sidebar header with "New Agent" button should render immediately
    const addButton = screen.getByTitle('New Agent');
    await user.click(addButton);

    // Verify navigation to /config/new
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CONFIG_NEW);
  });

  it('should navigate to new agent route when clicking new agent button multiple times', async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <TestWrapper initialAgents={mockAgents}>
        <AgentConfig />
      </TestWrapper>
    );

    // The sidebar header with "New Agent" button should render immediately
    const addButton1 = screen.getByTitle('New Agent');
    await user.click(addButton1);

    // Verify navigation to /config/new
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CONFIG_NEW);

    // Reset mock to test second click
    mockNavigate.mockClear();

    // Re-render to get the button again
    rerender(
      <TestWrapper initialAgents={mockAgents}>
        <AgentConfig />
      </TestWrapper>
    );

    // The button should render immediately again
    const addButton2 = screen.getByTitle('New Agent');
    await user.click(addButton2);

    // Verify navigation to /config/new again
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.CONFIG_NEW);
  });
});
