import {
  AgentType,
  ResponseLength,
  Gender,
  Sentiment,
  Availability,
  PersonalityType,
  Language,
} from '@openai/shared-types';

/**
 * Agent configuration interface
 * Based on AgentConfigDto but as a type for runtime use
 */
export interface AgentConfig {
  temperature?: number;
  system_prompt?: string;
  behavior_rules?: string | string[] | { rules: string[] };
  model?: string;
  max_tokens?: number;
  response_length?: ResponseLength;
  age?: number;
  gender?: Gender;
  personality?: PersonalityType;
  sentiment?: Sentiment;
  interests?: string[];
  availability?: Availability;
  agentType?: AgentType | null;
  language?: Language | null;
}

/**
 * System configuration keys
 * Known system configuration keys used in the application
 */
export type SystemConfigKey = 'behavior_rules' | 'system_prompt';

/**
 * System configuration value types
 * Maps known system config keys to their value types
 */
export interface SystemConfigValues {
  behavior_rules?: string | string[] | { rules: string[] };
  system_prompt?: string;
}

/**
 * System configuration record
 * Type-safe version of Record<string, unknown> for system configs
 */
export type SystemConfig = Partial<SystemConfigValues> & {
  [key: string]: unknown; // Allow additional unknown keys for flexibility
};

/**
 * Message metadata interface
 * Known metadata fields stored with messages
 */
export interface MessageMetadata {
  model?: string;
  temperature?: number;
  [key: string]: unknown; // Allow additional unknown keys for flexibility
}
