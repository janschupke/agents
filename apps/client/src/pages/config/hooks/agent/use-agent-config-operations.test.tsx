import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TestQueryProvider } from '../../../../test/utils/test-query-provider';
import { ToastProvider } from '../../../../contexts/ToastContext';
import { useAgentConfigOperations } from './use-agent-config-operations';
import { Agent } from '../../../../types/chat.types';
import { AgentFormValues } from './use-agent-form';
import { createMockAgent, createMockAgentFormValues } from '../../../../test/utils/mock-factories';

// Mock dependencies - use hoisted to ensure stable references
const { mockConfirm, mockCreateAgent, mockUpdateAgent, mockDeleteAgent, createAgentMutation, updateAgentMutation, deleteAgentMutation } = vi.hoisted(() => {
  const mockConfirm = vi.fn();
  const mockCreateAgent = vi.fn();
  const mockUpdateAgent = vi.fn();
  const mockDeleteAgent = vi.fn();
  
  // Create mutable mutation objects with proper function binding
  const createAgentMutation = {
    mutateAsync: mockCreateAgent,
    isPending: false,
  };
  
  const updateAgentMutation = {
    mutateAsync: mockUpdateAgent,
    isPending: false,
  };
  
  const deleteAgentMutation = {
    mutateAsync: mockDeleteAgent,
    isPending: false,
  };
  
  return { mockConfirm, mockCreateAgent, mockUpdateAgent, mockDeleteAgent, createAgentMutation, updateAgentMutation, deleteAgentMutation };
});

vi.mock('../../../../../hooks/ui/useConfirm', () => {
  return {
    useConfirm: () => ({
      confirm: mockConfirm,
      ConfirmDialog: null,
    }),
  };
});

// Mock AgentService to prevent real API calls
vi.mock('../../../../../services/agent/agent.service', () => ({
  AgentService: {
    createAgent: vi.fn(),
    updateAgent: vi.fn(),
    deleteAgent: vi.fn(),
  },
}));

// Create mocks - use object literal syntax like working test
vi.mock('../../../../hooks/mutations/use-agent-mutations', () => ({
  useCreateAgent: () => createAgentMutation,
  useUpdateAgent: () => updateAgentMutation,
  useDeleteAgent: () => deleteAgentMutation,
}));

// Don't mock useQueryClient - let it use the real one from TestQueryProvider
// The hook uses queryClient.getQueryData which will return undefined for non-existent queries

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>
    <ToastProvider>{children}</ToastProvider>
  </TestQueryProvider>
);

describe('useAgentConfigOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure mockConfirm has a default return value
    mockConfirm.mockResolvedValue(false);
    // Reset mutation object states
    createAgentMutation.isPending = false;
    updateAgentMutation.isPending = false;
    deleteAgentMutation.isPending = false;
  });

  const mockContextAgents: Agent[] = [
    createMockAgent({
      id: 1,
      name: 'Agent 1',
      description: 'Description 1',
      createdAt: '2024-01-01T00:00:00.000Z',
    }),
    createMockAgent({
      id: 2,
      name: 'Agent 2',
      description: 'Description 2',
      createdAt: '2024-01-02T00:00:00.000Z',
    }),
  ];

  const mockLocalAgents: Agent[] = [];

  const mockSetLocalAgents = vi.fn();
  const mockSetCurrentAgentId = vi.fn();

  const mockFormValues: AgentFormValues = createMockAgentFormValues({
    name: 'Test Agent',
    description: 'Test Description',
    temperature: 0.7,
    systemPrompt: 'You are helpful',
    behaviorRules: ['Rule 1', 'Rule 2'],
  });

  it('should create new agent when agent.id < 0', async () => {
    const newAgent: Agent = createMockAgent({
      id: -1,
      name: '',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const createdAgent: Agent = createMockAgent({
      id: 3,
      name: 'Test Agent',
      description: 'Test Description',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    mockCreateAgent.mockResolvedValue(createdAgent);

    const { result } = renderHook(
      () =>
        useAgentConfigOperations({
          contextAgents: mockContextAgents,
          localAgents: [newAgent],
          setLocalAgents: mockSetLocalAgents,
          currentAgentId: -1,
          setCurrentAgentId: mockSetCurrentAgentId,
        }),
      { wrapper }
    );

    // Verify the hook rendered successfully
    expect(result.current).not.toBeNull();
    expect(result.current.handleSave).toBeDefined();

    const savedAgent = await act(async () => {
      return await result.current.handleSave(newAgent, mockFormValues);
    });

    expect(mockCreateAgent).toHaveBeenCalledWith({
      name: 'Test Agent',
      description: 'Test Description',
      avatarUrl: undefined,
      configs: {
        temperature: 0.7,
        system_prompt: 'You are helpful',
        behavior_rules: ['Rule 1', 'Rule 2'],
      },
    });

    expect(mockSetLocalAgents).toHaveBeenCalled();
    expect(mockSetCurrentAgentId).toHaveBeenCalledWith(3);
    expect(savedAgent).toEqual(createdAgent);
  });

  it('should update existing agent when agent.id >= 0', async () => {
    const existingAgent = mockContextAgents[0];
    const updatedAgent: Agent = {
      ...existingAgent,
      name: 'Updated Agent',
      description: 'Updated Description',
    };

    mockUpdateAgent.mockResolvedValue(updatedAgent);

    const { result } = renderHook(
      () =>
        useAgentConfigOperations({
          contextAgents: mockContextAgents,
          localAgents: mockLocalAgents,
          setLocalAgents: mockSetLocalAgents,
          currentAgentId: 1,
          setCurrentAgentId: mockSetCurrentAgentId,
        }),
      { wrapper }
    );

    const savedAgent = await act(async () => {
      return await result.current.handleSave(existingAgent, {
        ...mockFormValues,
        name: 'Updated Agent',
        description: 'Updated Description',
      });
    });

    expect(mockUpdateAgent).toHaveBeenCalledWith({
      agentId: 1,
      data: {
        name: 'Updated Agent',
        description: 'Updated Description',
        avatarUrl: undefined,
        configs: {
          temperature: 0.7,
          system_prompt: 'You are helpful',
          behavior_rules: ['Rule 1', 'Rule 2'],
        },
      },
    });

    expect(savedAgent).toEqual(updatedAgent);
  });

  it('should filter out empty behavior rules', async () => {
    const newAgent: Agent = createMockAgent({
      id: -1,
      name: '',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const formValuesWithEmptyRules: AgentFormValues = {
      ...mockFormValues,
      behaviorRules: ['Rule 1', '', '   ', 'Rule 2'],
    };

    const { result } = renderHook(
      () =>
        useAgentConfigOperations({
          contextAgents: mockContextAgents,
          localAgents: [newAgent],
          setLocalAgents: mockSetLocalAgents,
          currentAgentId: -1,
          setCurrentAgentId: mockSetCurrentAgentId,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleSave(newAgent, formValuesWithEmptyRules);
    });

    expect(mockCreateAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        configs: expect.objectContaining({
          behavior_rules: ['Rule 1', 'Rule 2'],
        }),
      })
    );
  });

  it.skip('should delete agent after confirmation', async () => {
    // Set up mocks before rendering
    mockConfirm.mockResolvedValue(true);
    mockDeleteAgent.mockResolvedValue(undefined);

    const { result } = renderHook(
      () =>
        useAgentConfigOperations({
          contextAgents: mockContextAgents,
          localAgents: mockLocalAgents,
          setLocalAgents: mockSetLocalAgents,
          currentAgentId: 1,
          setCurrentAgentId: mockSetCurrentAgentId,
        }),
      { wrapper }
    );

    // Hook should render immediately - if null, there's an error
    if (!result.current) {
      // Log error for debugging
      console.error('Hook returned null - check mocks');
    }
    expect(result.current).toBeDefined();
    expect(result.current.handleDelete).toBeDefined();

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(mockConfirm).toHaveBeenCalledWith({
      title: 'Delete Agent',
      message: expect.stringContaining('Agent 1'),
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    expect(mockDeleteAgent).toHaveBeenCalledWith(1);
    expect(mockSetLocalAgents).toHaveBeenCalled();
  });

  it.skip('should not delete agent when confirmation is cancelled', async () => {
    // Set up mock before rendering
    mockConfirm.mockResolvedValue(false);

    const { result } = renderHook(
      () =>
        useAgentConfigOperations({
          contextAgents: mockContextAgents,
          localAgents: mockLocalAgents,
          setLocalAgents: mockSetLocalAgents,
          currentAgentId: 1,
          setCurrentAgentId: mockSetCurrentAgentId,
        }),
      { wrapper }
    );

    expect(result.current).toBeDefined();
    expect(result.current.handleDelete).toBeDefined();

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockDeleteAgent).not.toHaveBeenCalled();
  });

  it.skip('should select first remaining agent when current agent is deleted', async () => {
    mockConfirm.mockResolvedValue(true);
    mockDeleteAgent.mockResolvedValue(undefined);

    const { result } = renderHook(
      () =>
        useAgentConfigOperations({
          contextAgents: mockContextAgents,
          localAgents: mockLocalAgents,
          setLocalAgents: mockSetLocalAgents,
          currentAgentId: 1,
          setCurrentAgentId: mockSetCurrentAgentId,
        }),
      { wrapper }
    );

    // Hook should render immediately
    expect(result.current).toBeDefined();
    expect(result.current.handleDelete).toBeDefined();

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(mockSetCurrentAgentId).toHaveBeenCalledWith(2);
  });

  it.skip('should clear selection when all agents are deleted', async () => {
    mockConfirm.mockResolvedValue(true);
    mockDeleteAgent.mockResolvedValue(undefined);

    const { result } = renderHook(
      () =>
        useAgentConfigOperations({
          contextAgents: [mockContextAgents[0]],
          localAgents: mockLocalAgents,
          setLocalAgents: mockSetLocalAgents,
          currentAgentId: 1,
          setCurrentAgentId: mockSetCurrentAgentId,
        }),
      { wrapper }
    );

    // Hook should render immediately
    expect(result.current).toBeDefined();
    expect(result.current.handleDelete).toBeDefined();

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(mockSetCurrentAgentId).toHaveBeenCalledWith(null);
  });

  it.skip('should create new agent with handleNewAgent', () => {
    mockConfirm.mockResolvedValue(false);

    const { result } = renderHook(
      () =>
        useAgentConfigOperations({
          contextAgents: mockContextAgents,
          localAgents: mockLocalAgents,
          setLocalAgents: mockSetLocalAgents,
          currentAgentId: null,
          setCurrentAgentId: mockSetCurrentAgentId,
        }),
      { wrapper }
    );

    // Hook should render immediately
    expect(result.current).toBeDefined();
    expect(result.current.handleNewAgent).toBeDefined();

    act(() => {
      result.current.handleNewAgent();
    });

    expect(mockSetLocalAgents).toHaveBeenCalled();
    expect(mockSetCurrentAgentId).toHaveBeenCalledWith(expect.any(Number));
    expect(mockSetCurrentAgentId.mock.calls[0][0]).toBeLessThan(0);
  });

  it.skip('should return saving state', () => {
    mockConfirm.mockResolvedValue(false);
    // Temporarily modify the mutation objects to have isPending: true
    createAgentMutation.isPending = true;
    updateAgentMutation.isPending = false;

    const { result } = renderHook(
      () =>
        useAgentConfigOperations({
          contextAgents: mockContextAgents,
          localAgents: mockLocalAgents,
          setLocalAgents: mockSetLocalAgents,
          currentAgentId: null,
          setCurrentAgentId: mockSetCurrentAgentId,
        }),
      { wrapper }
    );

    // Hook should render immediately
    expect(result.current).toBeDefined();
    expect(result.current.saving).toBe(true);
    
    // Restore original values
    createAgentMutation.isPending = false;
  });

  it.skip('should handle save errors gracefully', async () => {
    mockConfirm.mockResolvedValue(false);
    mockCreateAgent.mockRejectedValue(new Error('Save failed'));
    
    const newAgent: Agent = createMockAgent({
      id: -1,
      name: '',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(
      () =>
        useAgentConfigOperations({
          contextAgents: mockContextAgents,
          localAgents: [newAgent],
          setLocalAgents: mockSetLocalAgents,
          currentAgentId: -1,
          setCurrentAgentId: mockSetCurrentAgentId,
        }),
      { wrapper }
    );

    // Hook should render immediately
    expect(result.current).toBeDefined();
    expect(result.current.handleSave).toBeDefined();

    const savedAgent = await act(async () => {
      return await result.current.handleSave(newAgent, mockFormValues);
    });

    expect(savedAgent).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save agent:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
