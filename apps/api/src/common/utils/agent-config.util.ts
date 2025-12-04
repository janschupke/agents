import { AgentConfigDto } from '../dto/agent.dto';

/**
 * Utility function to map AgentConfigDto to configs object
 * Centralized to avoid duplication
 */
export function mapAgentConfigs(
  configs?: AgentConfigDto
): Record<string, unknown> | undefined {
  if (!configs) {
    return undefined;
  }

  return {
    temperature: configs.temperature,
    system_prompt: configs.system_prompt,
    behavior_rules: configs.behavior_rules,
    model: configs.model,
    max_tokens: configs.max_tokens,
    // New fields
    response_length: configs.response_length,
    age: configs.age,
    gender: configs.gender,
    personality: configs.personality,
    sentiment: configs.sentiment,
    interests: configs.interests,
    availability: configs.availability,
  };
}
