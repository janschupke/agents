import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAgentForm } from './use-agent-form';
import { Agent } from '../../../../types/chat.types';
import { createMockAgent } from '../../../../test/utils/mock-factories';

// Mock useFormValidation
const mockSetValue = vi.fn();
const mockSetTouched = vi.fn();
const mockValidateAll = vi.fn(() => ({ isValid: true, errors: {} }));
const mockReset = vi.fn();

const mockValues = {
  name: '',
  description: '',
  avatarUrl: null,
  temperature: 0.7,
  systemPrompt: '',
  behaviorRules: [],
};

const mockErrors = {};
const mockTouched = {};

vi.mock('@openai/utils', () => ({
  useFormValidation: () => ({
    values: mockValues,
    errors: mockErrors,
    touched: mockTouched,
    setValue: mockSetValue,
    setTouched: mockSetTouched,
    validateAll: mockValidateAll,
    reset: mockReset,
  }),
  validationRules: {
    required: (message: string) => (value: unknown) =>
      !value ? message : null,
  },
}));

describe('useAgentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values when no agent provided', () => {
    const { result } = renderHook(() =>
      useAgentForm({
        agent: null,
        agentData: null,
      })
    );

    expect(result.current.values).toEqual(mockValues);
  });

  it('should initialize with agent values when agent and agentData provided', async () => {
    const mockAgent: Agent = createMockAgent({
      id: 1,
      name: 'Test Agent',
      description: 'Test Description',
      avatarUrl: 'https://example.com/avatar.png',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const mockAgentData: Agent = {
      ...mockAgent,
      configs: {
        temperature: 0.8,
        system_prompt: 'You are helpful',
        behavior_rules: ['Rule 1', 'Rule 2'],
      },
    };

    // Start with null, then update to trigger useEffect
    const { rerender } = renderHook<
      ReturnType<typeof useAgentForm>,
      { agent: Agent | null; agentData: Agent | null }
    >(
      ({ agent, agentData }) =>
        useAgentForm({
          agent,
          agentData,
        }),
      {
        initialProps: { agent: null, agentData: null },
      }
    );

    // Update to trigger useEffect
    rerender({ agent: mockAgent, agentData: mockAgentData });

    // Wait for useEffect to run
    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith('name', 'Test Agent');
    });

    expect(mockSetValue).toHaveBeenCalledWith('name', 'Test Agent');
    expect(mockSetValue).toHaveBeenCalledWith(
      'description',
      'You are helpful' // description field is populated from config.system_prompt
    );
    expect(mockSetValue).toHaveBeenCalledWith(
      'avatarUrl',
      'https://example.com/avatar.png'
    );
    expect(mockSetValue).toHaveBeenCalledWith('agentType', expect.any(String));
    expect(mockSetValue).toHaveBeenCalledWith('language', null);
    expect(mockSetValue).toHaveBeenCalledWith('temperature', 0.8);
    expect(mockSetValue).toHaveBeenCalledWith('behaviorRules', [
      'Rule 1',
      'Rule 2',
    ]);
  });

  it('should initialize with new agent values when agent.id < 0', async () => {
    const mockNewAgent: Agent = createMockAgent({
      id: -1,
      name: 'New Agent',
      description: 'New Description',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    // Start with null, then update to trigger useEffect
    const { rerender } = renderHook<
      ReturnType<typeof useAgentForm>,
      { agent: Agent | null; agentData: Agent | null }
    >(
      ({ agent, agentData }) =>
        useAgentForm({
          agent,
          agentData,
        }),
      {
        initialProps: { agent: null, agentData: null },
      }
    );

    // Update to trigger useEffect
    rerender({ agent: mockNewAgent, agentData: null });

    // Wait for useEffect to run
    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith('name', 'New Agent');
    });

    expect(mockSetValue).toHaveBeenCalledWith('name', 'New Agent');
    expect(mockSetValue).toHaveBeenCalledWith('description', ''); // New agent has empty description
    expect(mockSetValue).toHaveBeenCalledWith('avatarUrl', null);
    expect(mockSetValue).toHaveBeenCalledWith('agentType', expect.any(String));
    expect(mockSetValue).toHaveBeenCalledWith('language', null);
    expect(mockSetValue).toHaveBeenCalledWith('temperature', 0.7);
    expect(mockSetValue).toHaveBeenCalledWith('behaviorRules', []);
  });

  it('should use default temperature when not provided in configs', async () => {
    const mockAgent: Agent = createMockAgent({
      id: 1,
      name: 'Test Agent',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const mockAgentData: Agent = {
      ...mockAgent,
      configs: {},
    };

    // Start with null, then update to trigger useEffect
    const { rerender } = renderHook<
      ReturnType<typeof useAgentForm>,
      { agent: Agent | null; agentData: Agent | null }
    >(
      ({ agent, agentData }) =>
        useAgentForm({
          agent,
          agentData,
        }),
      {
        initialProps: { agent: null, agentData: null },
      }
    );

    // Update to trigger useEffect
    rerender({ agent: mockAgent, agentData: mockAgentData });

    // Wait for useEffect to run
    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith('temperature', 0.7);
    });
  });

  it('should handle empty description', async () => {
    const mockAgent: Agent = createMockAgent({
      id: 1,
      name: 'Test Agent',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const mockAgentData: Agent = {
      ...mockAgent,
      configs: {},
    };

    // Start with null, then update to trigger useEffect
    const { rerender } = renderHook<
      ReturnType<typeof useAgentForm>,
      { agent: Agent | null; agentData: Agent | null }
    >(
      ({ agent, agentData }) =>
        useAgentForm({
          agent,
          agentData,
        }),
      {
        initialProps: { agent: null, agentData: null },
      }
    );

    // Update to trigger useEffect
    rerender({ agent: mockAgent, agentData: mockAgentData });

    // Wait for useEffect to run
    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith('description', '');
    });
  });

  it('should update form when agent ID changes', () => {
    const mockAgent1: Agent = createMockAgent({
      id: 1,
      name: 'Agent 1',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const mockAgentData1: Agent = {
      ...mockAgent1,
      configs: {
        temperature: 0.7,
      },
    };

    const { rerender } = renderHook(
      ({ agent, agentData }) =>
        useAgentForm({
          agent,
          agentData,
        }),
      {
        initialProps: {
          agent: mockAgent1,
          agentData: mockAgentData1,
        },
      }
    );

    const mockAgent2: Agent = createMockAgent({
      id: 2,
      name: 'Agent 2',
      createdAt: '2024-01-02T00:00:00.000Z',
    });

    const mockAgentData2: Agent = {
      ...mockAgent2,
      configs: {
        temperature: 0.8,
      },
    };

    rerender({
      agent: mockAgent2,
      agentData: mockAgentData2,
    });

    expect(mockSetValue).toHaveBeenCalledWith('name', 'Agent 2');
    expect(mockSetValue).toHaveBeenCalledWith('temperature', 0.8);
  });

  it('should reset form when agent becomes null', () => {
    const mockAgent: Agent = createMockAgent({
      id: 1,
      name: 'Test Agent',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const { rerender } = renderHook<
      ReturnType<typeof useAgentForm>,
      { agent: Agent | null; agentData: Agent | null }
    >(
      ({ agent, agentData }) =>
        useAgentForm({
          agent,
          agentData,
        }),
      {
        initialProps: {
          agent: mockAgent,
          agentData: mockAgent,
        },
      }
    );

    rerender({
      agent: null,
      agentData: null,
    });

    expect(mockReset).toHaveBeenCalled();
  });

  it('should provide setValue function', () => {
    const { result } = renderHook(() =>
      useAgentForm({
        agent: null,
        agentData: null,
      })
    );

    expect(result.current.setValue).toBe(mockSetValue);
  });

  it('should provide setTouched function', () => {
    const { result } = renderHook(() =>
      useAgentForm({
        agent: null,
        agentData: null,
      })
    );

    expect(result.current.setTouched).toBe(mockSetTouched);
  });

  it('should provide validateAll function', () => {
    const { result } = renderHook(() =>
      useAgentForm({
        agent: null,
        agentData: null,
      })
    );

    expect(result.current.validateAll).toBe(mockValidateAll);
  });

  it('should provide reset function', () => {
    const { result } = renderHook(() =>
      useAgentForm({
        agent: null,
        agentData: null,
      })
    );

    expect(result.current.reset).toBe(mockReset);
  });
});
