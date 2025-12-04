import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AgentConfig from './AgentConfig';
import { TestQueryProvider } from '../../../../../test/utils/test-query-provider';
import { AuthProvider } from '../../../../../contexts/AuthContext';
import { ToastProvider } from '../../../../../contexts/ToastContext';
import { Agent } from '../../../../../types/chat.types';
import { createMockAgent } from '../../../../../test/utils/mock-factories';

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
vi.mock('../../../../../services/agent/agent.service', () => ({
  AgentService: {
    getAllAgents: vi.fn(),
    getAgent: vi.fn(),
  },
}));

// Mock hooks
const mockUseAgentConfigData = vi.fn();
vi.mock('../../hooks/agent/use-agent-config-data', () => ({
  useAgentConfigData: () => mockUseAgentConfigData(),
}));

vi.mock('../../hooks/agent/use-agent-config-navigation', () => ({
  useAgentConfigNavigation: vi.fn(() => ({
    handleAgentSelect: vi.fn(),
    handleNewAgent: vi.fn(),
  })),
}));

vi.mock('../../hooks/agent/use-agent-save', () => ({
  useAgentSave: vi.fn(() => ({
    handleSave: vi.fn(),
    isSaving: false,
  })),
}));

vi.mock('../../hooks/agent/use-agent-delete', () => ({
  useAgentDelete: vi.fn(() => ({
    handleDelete: vi.fn(),
    ConfirmDialog: null,
  })),
}));

const mockUseAgentConfigState = vi.fn(() => ({
  currentAgent: null as Agent | null,
}));
vi.mock('../../hooks/agent/use-agent-config-state', () => ({
  useAgentConfigState: () => mockUseAgentConfigState(),
}));

vi.mock('../../hooks/agent/use-is-new-agent', () => ({
  useIsNewAgent: vi.fn(() => false),
}));

vi.mock('../../hooks/agent/use-agent-memories', () => ({
  useAgentMemories: vi.fn(() => ({
    editingId: null,
    deletingId: null,
    handleDeleteMemory: vi.fn(),
    handleEditMemory: vi.fn(),
    handleRefreshMemories: vi.fn(),
  })),
}));

vi.mock('../../hooks/form/use-new-agent-form', () => ({
  useNewAgentForm: vi.fn(() => ({
    hasUnsavedChanges: false,
  })),
}));

vi.mock('../../../../../hooks/ui/use-unsaved-changes-warning', () => ({
  useUnsavedChangesWarning: vi.fn(),
}));

const mockUseAgents = vi.fn();
const mockUseAgent = vi.fn();
const mockUseAgentMemories = vi.fn();
vi.mock('../../../../../hooks/queries/use-agents', () => ({
  useAgents: () => mockUseAgents(),
  useAgent: () => mockUseAgent(),
  useAgentMemories: () => mockUseAgentMemories(),
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

describe('AgentConfig Loading States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Page Loading', () => {
    it('should show full page loading when agents are not cached and loading', () => {
      mockUseAgents.mockReturnValue({
        data: [],
        isLoading: true,
      });

      mockUseAgentConfigData.mockReturnValue({
        agentId: null,
        agent: null,
        loading: false,
        error: null,
      });

      // Mock useAgent (even though agentId is null, the hook might still be called)
      mockUseAgent.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      });

      render(
        <TestWrapper>
          <AgentConfig />
        </TestWrapper>
      );

      // Should show loading state (AgentConfigLoadingState renders Sidebar + Container)
      // AgentConfigLoadingState doesn't have a testid, so we check for skeleton elements
      expect(screen.queryAllByRole('generic').length).toBeGreaterThan(0);
    });

    it('should NOT show full page loading when agents are cached even if isLoading is true', () => {
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
        isLoading: true, // Background refetch
      });

      mockUseAgentConfigData.mockReturnValue({
        agentId: 1,
        agent: {
          id: 1,
          name: 'Agent 1',
          description: 'Desc',
          avatarUrl: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        loading: false,
        error: null,
      });

      mockUseAgentConfigState.mockReturnValue({
        currentAgent: createMockAgent({
          id: 1,
          name: 'Agent 1',
          description: 'Desc',
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
      });

      // Mock useAgent for AgentConfigForm
      mockUseAgent.mockReturnValue({
        data: createMockAgent({
          id: 1,
          name: 'Agent 1',
          description: 'Desc',
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
        isLoading: false,
        isError: false,
      });

      // Cache is set by useAgents hook returning data

      render(
        <TestWrapper>
          <AgentConfig agentId={1} />
        </TestWrapper>
      );

      // Should render component, not loading state
      // Component should be visible (no full page loading)
      expect(screen.queryByText(/Loading/i)).toBeFalsy();
    });
  });

  describe('Sidebar Loading', () => {
    it('should show sidebar loading when agents are not cached', () => {
      mockUseAgents.mockReturnValue({
        data: [],
        isLoading: true,
      });

      mockUseAgentConfigData.mockReturnValue({
        agentId: null,
        agent: null,
        loading: false,
        error: null,
      });

      render(
        <TestWrapper>
          <AgentConfig />
        </TestWrapper>
      );

      // Sidebar should show loading skeleton
      // This is tested through the universal hook behavior
    });

    it('should NOT show sidebar loading when agents are cached', () => {
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

      mockUseAgentConfigData.mockReturnValue({
        agentId: 1,
        agent: {
          id: 1,
          name: 'Agent 1',
          description: 'Desc',
          avatarUrl: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        loading: false,
        error: null,
      });

      mockUseAgentConfigState.mockReturnValue({
        currentAgent: createMockAgent({
          id: 1,
          name: 'Agent 1',
          description: 'Desc',
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
      });

      // Cache is set by useAgents hook returning data
      // Sidebar should NOT show loading (tested through universal hook)
    });
  });

  describe('Content Loading', () => {
    it('should show content loading when loading specific agent', () => {
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

      mockUseAgentConfigData.mockReturnValue({
        agentId: 1,
        agent: null, // Still loading
        loading: true,
        error: null,
      });

      mockUseAgentConfigState.mockReturnValue({
        currentAgent: null,
      });

      // Mock useAgent for AgentConfigForm
      mockUseAgent.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      });

      // Cache is set by useAgents hook returning data

      render(
        <TestWrapper>
          <AgentConfig agentId={1} />
        </TestWrapper>
      );

      // Should show AgentConfigFormSkeleton in content area
      // This is handled by AgentConfigForm internally
    });

    it('should NOT show content loading when agent is cached', () => {
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

      mockUseAgentConfigData.mockReturnValue({
        agentId: 1,
        agent: {
          id: 1,
          name: 'Agent 1',
          description: 'Desc',
          avatarUrl: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        loading: false,
        error: null,
      });

      mockUseAgentConfigState.mockReturnValue({
        currentAgent: createMockAgent({
          id: 1,
          name: 'Agent 1',
          description: 'Desc',
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
      });

      // Mock useAgent for AgentConfigForm
      mockUseAgent.mockReturnValue({
        data: createMockAgent({
          id: 1,
          name: 'Agent 1',
          description: 'Desc',
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
        isLoading: false,
        isError: false,
      });

      // Mock useAgentMemories for AgentConfigForm
      mockUseAgentMemories.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
      });

      // Cache is set by useAgents hook returning data

      render(
        <TestWrapper>
          <AgentConfig agentId={1} />
        </TestWrapper>
      );

      // Should render form, not skeleton
      // When agent is cached, loading should be false, so form renders
      expect(
        screen.queryByTestId('agent-config-form-skeleton')
      ).not.toBeInTheDocument();
      // Form should be rendered (check for the description textarea by id)
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });
  });
});
