import {
  Agent,
  UpdateAgentRequest,
  ResponseLength,
  Gender,
  Sentiment,
  Availability,
} from '../../../types/agent.types';
import { AgentArchetype } from '../../../types/agent-archetype.types';
import { AgentFormData } from '../../../types/agent-form.types';
import { PersonalityType } from '@openai/shared-types';
import { AgentArchetypeService } from '../../../services/agent-archetype.service';

/**
 * Maps Agent or AgentArchetype to AgentFormData
 */
export function mapToFormData(
  agent: Agent | AgentArchetype | null | undefined
): AgentFormData | null {
  if (!agent) return null;

  const configs = agent.configs || {};
  return {
    name: agent.name || '',
    description: agent.description || undefined,
    avatarUrl: agent.avatarUrl || undefined,
    agentType: agent.agentType || undefined,
    language: agent.language || undefined,
    temperature: configs.temperature as number | undefined,
    model: (configs.model as string) || undefined,
    maxTokens: configs.max_tokens as number | undefined,
    responseLength: (configs.response_length as ResponseLength) || undefined,
    age: configs.age as number | undefined,
    gender: (configs.gender as Gender) || undefined,
    personality: (configs.personality as PersonalityType) || undefined,
    sentiment: (configs.sentiment as Sentiment) || undefined,
    interests: (configs.interests as string[]) || undefined,
    availability: (configs.availability as Availability) || undefined,
  };
}

/**
 * Maps AgentFormData to UpdateAgentRequest
 */
export function mapFormDataToUpdateRequest(
  data: AgentFormData
): UpdateAgentRequest {
  const configs: Record<string, unknown> = {};

  if (data.temperature !== undefined) {
    configs.temperature = data.temperature;
  }
  if (data.model) {
    configs.model = data.model;
  }
  if (data.maxTokens !== undefined) {
    configs.max_tokens = data.maxTokens;
  }
  if (data.responseLength) {
    configs.response_length = data.responseLength;
  }
  if (data.age !== undefined) {
    configs.age = data.age;
  }
  if (data.gender) {
    configs.gender = data.gender;
  }
  if (data.personality) {
    configs.personality = data.personality;
  }
  if (data.sentiment) {
    configs.sentiment = data.sentiment;
  }
  if (data.interests && data.interests.length > 0) {
    configs.interests = data.interests;
  }
  if (data.availability) {
    configs.availability = data.availability;
  }

  return {
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    avatarUrl: data.avatarUrl?.trim() || undefined,
    agentType: data.agentType || undefined,
    language: data.language?.trim() || undefined,
    configs: Object.keys(configs).length > 0 ? configs : undefined,
  };
}

/**
 * Maps AgentFormData to CreateArchetypeRequest
 */
export function mapFormDataToArchetypeRequest(
  data: AgentFormData
): Parameters<typeof AgentArchetypeService.createArchetype>[0] {
  const configs: Record<string, unknown> = {};

  if (data.temperature !== undefined) {
    configs.temperature = data.temperature;
  }
  if (data.model) {
    configs.model = data.model;
  }
  if (data.maxTokens !== undefined) {
    configs.max_tokens = data.maxTokens;
  }
  if (data.responseLength) {
    configs.response_length = data.responseLength;
  }
  if (data.age !== undefined) {
    configs.age = data.age;
  }
  if (data.gender) {
    configs.gender = data.gender;
  }
  if (data.personality) {
    configs.personality = data.personality;
  }
  if (data.sentiment) {
    configs.sentiment = data.sentiment;
  }
  if (data.interests && data.interests.length > 0) {
    configs.interests = data.interests;
  }
  if (data.availability) {
    configs.availability = data.availability;
  }

  return {
    name: data.name.trim(),
    description: data.description?.trim() || undefined,
    avatarUrl: data.avatarUrl?.trim() || undefined,
    agentType: data.agentType || undefined,
    language: data.language?.trim() || undefined,
    configs: Object.keys(configs).length > 0 ? configs : undefined,
  };
}
