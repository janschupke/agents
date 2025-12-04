import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAgentConfigState } from './use-agent-config-state';
import { Agent } from '../../../../types/chat.types';
import { createMockAgent } from '../../../../test/utils/mock-factories';

// Mock useNewAgentForm
const mockFormData: Partial<Agent> = {
  name: 'New Agent',
  description: 'New Description',
  avatarUrl: null,
  configs: {
    temperature: 0.8,
    system_prompt: 'Test prompt',
    behavior_rules: ['Rule 1'],
  },
};

const mockUseNewAgentForm = vi.fn(() => ({
  formData: mockFormData,
}));

vi.mock('../form/use-new-agent-form', () => ({
  useNewAgentForm: () => mockUseNewAgentForm(),
}));

describe('useAgentConfigState', () => {
  it('should return temp agent when isNewAgent is true', () => {
    const { result } = renderHook(() =>
      useAgentConfigState({
        isNewAgent: true,
        agent: null,
      })
    );

    expect(result.current.currentAgent).toEqual({
      id: -1,
      name: 'New Agent',
      description: 'New Description',
      avatarUrl: null,
      agentType: null,
      language: null,
      createdAt: expect.any(String),
      configs: {
        temperature: 0.8,
        system_prompt: 'Test prompt',
        behavior_rules: ['Rule 1'],
      },
    });
  });

  it('should return existing agent when isNewAgent is false', () => {
    const existingAgent: Agent = createMockAgent({
      id: 1,
      name: 'Existing Agent',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const { result } = renderHook(() =>
      useAgentConfigState({
        isNewAgent: false,
        agent: existingAgent,
      })
    );

    expect(result.current.currentAgent).toEqual(existingAgent);
  });

  it('should return null when agent is null and isNewAgent is false', () => {
    const { result } = renderHook(() =>
      useAgentConfigState({
        isNewAgent: false,
        agent: null,
      })
    );

    expect(result.current.currentAgent).toBeNull();
  });

  it('should use default configs when formData configs are missing', () => {
    mockUseNewAgentForm.mockReturnValueOnce({
      formData: {
        name: 'Test',
        description: null,
        avatarUrl: null,
      },
    });

    const { result } = renderHook(() =>
      useAgentConfigState({
        isNewAgent: true,
        agent: null,
      })
    );

    expect(result.current.currentAgent?.configs).toEqual({
      temperature: 1,
      system_prompt: '',
      behavior_rules: [],
    });
  });
});
