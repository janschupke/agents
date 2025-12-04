import { Agent } from '../../types/chat.types';
import { AgentType } from '../../types/agent.types';
import { AgentFormValues } from '../../pages/config/hooks/agent/use-agent-form';

/**
 * Creates a mock Agent object with sensible defaults
 * @param overrides - Partial properties to override defaults
 */
export function createMockAgent(overrides?: Partial<Agent>): Agent {
  return {
    id: 1,
    name: 'Test Agent',
    description: null,
    avatarUrl: null,
    agentType: null,
    language: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/**
 * Creates a mock AgentFormValues object with sensible defaults
 * @param overrides - Partial properties to override defaults
 */
export function createMockAgentFormValues(
  overrides?: Partial<AgentFormValues>
): AgentFormValues {
  return {
    name: 'Test Agent',
    description: '',
    avatarUrl: null,
    agentType: AgentType.GENERAL,
    language: null,
    temperature: 0.7,
    systemPrompt: 'You are a helpful assistant.',
    behaviorRules: [],
    ...overrides,
  };
}
