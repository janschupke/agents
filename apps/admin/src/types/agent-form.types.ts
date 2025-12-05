import {
  AgentType,
  ResponseLength,
  Gender,
  Sentiment,
  Availability,
} from './agent.types';
import { PersonalityType } from '@openai/shared-types';

export enum AgentFormMode {
  ARCHETYPE = 'archetype',
  AGENT = 'agent',
}

export interface AgentFormData {
  // Basic fields
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;

  // Configuration fields
  temperature?: number;
  systemPrompt?: string; // Only for archetype mode
  behaviorRules?: string[]; // Only for archetype mode
  model?: string;
  maxTokens?: number;
  responseLength?: ResponseLength;

  // Personality fields
  age?: number;
  gender?: Gender;
  personality?: PersonalityType;
  sentiment?: Sentiment;
  interests?: string[];
  availability?: Availability;
}
