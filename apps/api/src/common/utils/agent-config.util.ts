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

  const mapped: Record<string, unknown> = {};

  // Include fields only if they're defined
  if (configs.temperature !== undefined) {
    mapped.temperature = configs.temperature;
  }
  if (configs.system_prompt !== undefined) {
    mapped.system_prompt = configs.system_prompt;
  }
  if (configs.model !== undefined) {
    mapped.model = configs.model;
  }
  if (configs.max_tokens !== undefined) {
    mapped.max_tokens = configs.max_tokens;
  }
  if (configs.response_length !== undefined) {
    mapped.response_length = configs.response_length;
  }
  if (configs.age !== undefined) {
    mapped.age = configs.age;
  }
  if (configs.gender !== undefined) {
    mapped.gender = configs.gender;
  }
  if (configs.personality !== undefined) {
    mapped.personality = configs.personality;
  }
  if (configs.sentiment !== undefined) {
    mapped.sentiment = configs.sentiment;
  }
  if (configs.interests !== undefined) {
    mapped.interests = configs.interests;
  }
  if (configs.availability !== undefined) {
    mapped.availability = configs.availability;
  }

  return mapped;
}
