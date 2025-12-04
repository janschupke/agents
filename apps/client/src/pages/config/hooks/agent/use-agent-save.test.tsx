import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAgentSave } from './use-agent-save';
import { Agent } from '../../../../types/chat.types';
import { AgentFormValues } from './use-agent-form';
import { TestQueryProvider } from '../../../../test/utils/test-query-provider';
import {
  createMockAgent,
  createMockAgentFormValues,
} from '../../../../test/utils/mock-factories';
import { AgentType } from '../../../../types/agent.types';

// Mock dependencies
const mockNavigate = vi.fn();
const mockSetFormData = vi.fn();
const mockCreateAgent = vi.fn();
const mockUpdateAgent = vi.fn();
const mockHandleSaveNavigation = vi.fn();

// Create mock functions that can be changed
const mockUseCreateAgent = vi.fn(() => ({
  mutateAsync: mockCreateAgent,
  isPending: false,
}));

const mockUseUpdateAgent = vi.fn(() => ({
  mutateAsync: mockUpdateAgent,
  isPending: false,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../form/use-new-agent-form', () => ({
  useNewAgentForm: () => ({
    setFormData: mockSetFormData,
    formData: {},
  }),
}));

vi.mock('../../../../hooks/mutations/use-agent-mutations', () => ({
  useCreateAgent: () => mockUseCreateAgent(),
  useUpdateAgent: () => mockUseUpdateAgent(),
}));

vi.mock('./use-agent-config-navigation', () => ({
  useAgentConfigNavigation: () => ({
    handleSave: mockHandleSaveNavigation,
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useAgentSave', () => {
  const mockFormValues: AgentFormValues = createMockAgentFormValues({
    name: 'Test Agent',
    description: 'You are helpful', // description is the system prompt field
    temperature: 0.7,
    behaviorRules: ['Rule 1', 'Rule 2'],
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create new agent when isNewAgent is true', async () => {
    const newAgent: Agent = createMockAgent({
      id: -1,
      name: '',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const savedAgent: Agent = createMockAgent({
      id: 1,
      name: 'Test Agent',
      description: 'Test Description',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    mockCreateAgent.mockResolvedValue(savedAgent);
    mockHandleSaveNavigation.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useAgentSave({ isNewAgent: true, navigate: mockNavigate }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleSave(newAgent, mockFormValues);
    });

    expect(mockSetFormData).toHaveBeenCalledWith({
      name: 'Test Agent',
      description: 'You are helpful',
      avatarUrl: null,
      agentType: AgentType.GENERAL,
      language: null,
      configs: {
        temperature: 0.7,
        system_prompt: 'You are helpful',
        behavior_rules: ['Rule 1', 'Rule 2'],
      },
    });

    expect(mockCreateAgent).toHaveBeenCalledWith({
      name: 'Test Agent',
      description: 'You are helpful',
      avatarUrl: undefined,
      agentType: AgentType.GENERAL,
      language: undefined,
      configs: {
        temperature: 0.7,
        system_prompt: 'You are helpful',
        behavior_rules: ['Rule 1', 'Rule 2'],
      },
    });

    expect(mockHandleSaveNavigation).toHaveBeenCalledWith(savedAgent, 1);
  });

  it('should update existing agent when isNewAgent is false', async () => {
    const existingAgent: Agent = createMockAgent({
      id: 1,
      name: 'Old Name',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    mockUpdateAgent.mockResolvedValue(undefined);
    mockHandleSaveNavigation.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useAgentSave({ isNewAgent: false, navigate: mockNavigate }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleSave(existingAgent, mockFormValues);
    });

    expect(mockUpdateAgent).toHaveBeenCalledWith({
      agentId: 1,
      data: {
        name: 'Test Agent',
        description: 'You are helpful',
        avatarUrl: undefined,
        agentType: AgentType.GENERAL,
        language: undefined,
        configs: {
          temperature: 0.7,
          system_prompt: 'You are helpful',
          behavior_rules: ['Rule 1', 'Rule 2'],
        },
      },
    });

    expect(mockHandleSaveNavigation).toHaveBeenCalledWith(existingAgent, 1);
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

    mockCreateAgent.mockResolvedValue({ id: 1 });
    mockHandleSaveNavigation.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useAgentSave({ isNewAgent: true, navigate: mockNavigate }),
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

  it('should handle empty behavior rules array', async () => {
    const newAgent: Agent = createMockAgent({
      id: -1,
      name: '',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const formValuesWithEmptyRules: AgentFormValues = {
      ...mockFormValues,
      behaviorRules: [],
    };

    mockCreateAgent.mockResolvedValue({ id: 1 });
    mockHandleSaveNavigation.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useAgentSave({ isNewAgent: true, navigate: mockNavigate }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleSave(newAgent, formValuesWithEmptyRules);
    });

    expect(mockCreateAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        configs: expect.objectContaining({
          behavior_rules: undefined,
        }),
      })
    );
  });

  it('should return isSaving as true when creating agent', () => {
    mockUseCreateAgent.mockReturnValueOnce({
      mutateAsync: mockCreateAgent,
      isPending: true,
    });

    const { result } = renderHook(
      () => useAgentSave({ isNewAgent: true, navigate: mockNavigate }),
      { wrapper }
    );

    expect(result.current.isSaving).toBe(true);
  });

  it('should return isSaving as true when updating agent', () => {
    mockUseUpdateAgent.mockReturnValueOnce({
      mutateAsync: mockUpdateAgent,
      isPending: true,
    });

    const { result } = renderHook(
      () => useAgentSave({ isNewAgent: false, navigate: mockNavigate }),
      { wrapper }
    );

    expect(result.current.isSaving).toBe(true);
  });

  it('should handle save errors', async () => {
    const newAgent: Agent = createMockAgent({
      id: -1,
      name: '',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateAgent.mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(
      () => useAgentSave({ isNewAgent: true, navigate: mockNavigate }),
      { wrapper }
    );

    await act(async () => {
      await expect(
        result.current.handleSave(newAgent, mockFormValues)
      ).rejects.toThrow();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save agent:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
