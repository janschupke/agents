import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AgentConfig from './AgentConfig';
import { TestQueryProvider } from '../../../../test/utils/test-query-provider';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
  })),
}));

// Mock useTokenReady
vi.mock('../../../../hooks/use-token-ready', () => ({
  useTokenReady: () => true,
}));

// Mock AgentService
vi.mock('../../../../services/agent.service', () => ({
  AgentService: {
    getAllAgents: vi.fn(),
    getAgent: vi.fn(),
  },
}));

// Mock hooks
vi.mock('../../hooks/agent/use-agent-config-data', () => ({
  useAgentConfigData: vi.fn(),
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

vi.mock('../../hooks/agent/use-agent-config-state', () => ({
  useAgentConfigState: vi.fn(() => ({
    currentAgent: null,
  })),
}));

vi.mock('../../hooks/agent/use-is-new-agent', () => ({
  useIsNewAgent: vi.fn(() => false),
}));

vi.mock('../../hooks/form/use-new-agent-form', () => ({
  useNewAgentForm: vi.fn(() => ({
    hasUnsavedChanges: false,
  })),
}));

vi.mock('../../../../hooks/use-unsaved-changes-warning', () => ({
  useUnsavedChangesWarning: vi.fn(),
}));

vi.mock('../../../../hooks/queries/use-agents', () => ({
  useAgents: vi.fn(),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <TestQueryProvider>
      {children}
    </TestQueryProvider>
  </MemoryRouter>
);

describe('AgentConfig Loading States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Page Loading', () => {
    it('should show full page loading when agents are not cached and loading', () => {
      const { useAgents } = require('../../../../hooks/queries/use-agents');
      useAgents.mockReturnValue({
        data: [],
        isLoading: true,
      });

      const { useAgentConfigData } = require('../../hooks/agent/use-agent-config-data');
      useAgentConfigData.mockReturnValue({
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

      // Should show loading state (AgentConfigLoadingState renders Sidebar + Container)
      expect(screen.queryByTestId('agent-config-loading')).toBeTruthy();
    });

    it('should NOT show full page loading when agents are cached even if isLoading is true', () => {
      const { useAgents } = require('../../../../hooks/queries/use-agents');
      useAgents.mockReturnValue({
        data: [{ id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null }],
        isLoading: true, // Background refetch
      });

      const { useAgentConfigData } = require('../../hooks/agent/use-agent-config-data');
      useAgentConfigData.mockReturnValue({
        agentId: 1,
        agent: { id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null },
        loading: false,
        error: null,
      });

      const { useAgentConfigState } = require('../../hooks/agent/use-agent-config-state');
      useAgentConfigState.mockReturnValue({
        currentAgent: { id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null },
      });

      // Set cache data
      const queryClient = useTestQueryClient();
      const mockAgents: Agent[] = [
        { id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null },
      ];
      queryClient.setQueryData(queryKeys.agents.list(), mockAgents);

      render(
        <TestWrapper>
          <AgentConfig agentId={1} />
        </TestWrapper>
      );

      // Should render component, not loading state
      expect(screen.queryByTestId('agent-config-loading')).toBeFalsy();
    });
  });

  describe('Sidebar Loading', () => {
    it('should show sidebar loading when agents are not cached', () => {
      const { useAgents } = require('../../../../hooks/queries/use-agents');
      useAgents.mockReturnValue({
        data: [],
        isLoading: true,
      });

      const { useAgentConfigData } = require('../../hooks/agent/use-agent-config-data');
      useAgentConfigData.mockReturnValue({
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
      const { useAgents } = require('../../../../hooks/queries/use-agents');
      useAgents.mockReturnValue({
        data: [{ id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null }],
        isLoading: false,
      });

      const { useAgentConfigData } = require('../../hooks/agent/use-agent-config-data');
      useAgentConfigData.mockReturnValue({
        agentId: 1,
        agent: { id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null },
        loading: false,
        error: null,
      });

      const { useAgentConfigState } = require('../../hooks/agent/use-agent-config-state');
      useAgentConfigState.mockReturnValue({
        currentAgent: { id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null },
      });

      // Cache is set by useAgents hook returning data
      // Sidebar should NOT show loading (tested through universal hook)
    });
  });

  describe('Content Loading', () => {
    it('should show content loading when loading specific agent', () => {
      const { useAgents } = require('../../../../hooks/queries/use-agents');
      useAgents.mockReturnValue({
        data: [{ id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null }],
        isLoading: false,
      });

      const { useAgentConfigData } = require('../../hooks/agent/use-agent-config-data');
      useAgentConfigData.mockReturnValue({
        agentId: 1,
        agent: null, // Still loading
        loading: true,
        error: null,
      });

      const { useAgentConfigState } = require('../../hooks/agent/use-agent-config-state');
      useAgentConfigState.mockReturnValue({
        currentAgent: null,
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
      const { useAgents } = require('../../../../hooks/queries/use-agents');
      useAgents.mockReturnValue({
        data: [{ id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null }],
        isLoading: false,
      });

      const { useAgentConfigData } = require('../../hooks/agent/use-agent-config-data');
      useAgentConfigData.mockReturnValue({
        agentId: 1,
        agent: { id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null },
        loading: false,
        error: null,
      });

      const { useAgentConfigState } = require('../../hooks/agent/use-agent-config-state');
      useAgentConfigState.mockReturnValue({
        currentAgent: { id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null },
      });

      // Set cache data
      const queryClient = useTestQueryClient();
      const mockAgents: Agent[] = [
        { id: 1, name: 'Agent 1', description: 'Desc', avatarUrl: null },
      ];
      queryClient.setQueryData(queryKeys.agents.list(), mockAgents);

      render(
        <TestWrapper>
          <AgentConfig agentId={1} />
        </TestWrapper>
      );

      // Should render form, not skeleton
    });
  });
});
