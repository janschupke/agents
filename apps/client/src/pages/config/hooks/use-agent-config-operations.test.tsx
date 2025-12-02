import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TestQueryProvider } from '../../../test/utils/test-query-provider';
import { useAgentConfigOperations } from './use-agent-config-operations';
import { Agent } from '../../../types/chat.types';
import { AgentFormValues } from './use-agent-form';

// Mock useConfirm
const mockConfirm = vi.fn();
vi.mock('../../../hooks/useConfirm', () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
    ConfirmDialog: null,
  }),
}));

// Mock mutation hooks
const mockCreateAgent = vi.fn();
const mockUpdateAgent = vi.fn();
const mockDeleteAgent = vi.fn();

const mockUseCreateAgent = vi.fn(() => ({
  mutateAsync: mockCreateAgent,
  isPending: false,
}));

const mockUseUpdateAgent = vi.fn(() => ({
  mutateAsync: mockUpdateAgent,
  isPending: false,
}));

const mockUseDeleteAgent = vi.fn(() => ({
  mutateAsync: mockDeleteAgent,
  isPending: false,
}));

vi.mock('../../../hooks/mutations/use-agent-mutations', () => ({
  useCreateAgent: () => mockUseCreateAgent(),
  useUpdateAgent: () => mockUseUpdateAgent(),
  useDeleteAgent: () => mockUseDeleteAgent(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useAgentConfigOperations', () => {
  const mockContextAgents: Agent[] = [
    {
      id: 1,
      name: 'Agent 1',
      description: 'Description 1',
      avatarUrl: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      name: 'Agent 2',
      description: 'Description 2',
      avatarUrl: null,
      createdAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  const mockLocalAgents: Agent[] = [];

  const mockSetLocalAgents = vi.fn();
  const mockSetCurrentAgentId = vi.fn();

  const mockFormValues: AgentFormValues = {
    name: 'Test Agent',
    description: 'Test Description',
    avatarUrl: null,
    temperature: 0.7,
    systemPrompt: 'You are helpful',
    behaviorRules: ['Rule 1', 'Rule 2'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create new agent when agent.id < 0', async () => {
    const newAgent: Agent = {
      id: -1,
      name: '',
      description: null,
      avatarUrl: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    const createdAgent: Agent = {
      id: 3,
      name: 'Test Agent',
      description: 'Test Description',
      avatarUrl: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

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
    const newAgent: Agent = {
      id: -1,
      name: '',
      description: null,
      avatarUrl: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

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

  it('should delete agent after confirmation', async () => {
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

  it('should not delete agent when confirmation is cancelled', async () => {
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

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockDeleteAgent).not.toHaveBeenCalled();
  });

  it('should select first remaining agent when current agent is deleted', async () => {
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

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(mockSetCurrentAgentId).toHaveBeenCalledWith(2);
  });

  it('should clear selection when all agents are deleted', async () => {
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

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(mockSetCurrentAgentId).toHaveBeenCalledWith(null);
  });

  it('should create new agent with handleNewAgent', () => {
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

    act(() => {
      result.current.handleNewAgent();
    });

    expect(mockSetLocalAgents).toHaveBeenCalled();
    expect(mockSetCurrentAgentId).toHaveBeenCalledWith(expect.any(Number));
    expect(mockSetCurrentAgentId.mock.calls[0][0]).toBeLessThan(0);
  });

  it('should return saving state', () => {
    mockUseCreateAgent.mockReturnValue({
      mutateAsync: mockCreateAgent,
      isPending: true,
    });

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

    expect(result.current.saving).toBe(true);
  });

  it('should handle save errors gracefully', async () => {
    const newAgent: Agent = {
      id: -1,
      name: '',
      description: null,
      avatarUrl: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateAgent.mockRejectedValue(new Error('Save failed'));

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
