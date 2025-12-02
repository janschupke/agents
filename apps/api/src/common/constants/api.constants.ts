import { NUMERIC_CONSTANTS } from './numeric.constants.js';

export const OPENAI_MODELS = {
  DEFAULT: 'gpt-4o-mini',
  TRANSLATION: 'gpt-4o-mini',
  MEMORY: 'gpt-4o-mini',
} as const;

export const DEFAULT_AGENT_CONFIG = {
  model: OPENAI_MODELS.DEFAULT,
  temperature: NUMERIC_CONSTANTS.DEFAULT_TEMPERATURE,
  max_tokens: NUMERIC_CONSTANTS.DEFAULT_MAX_TOKENS,
  system_prompt: 'You are a helpful assistant.',
} as const;

export const MEMORY_CONFIG = {
  SIMILARITY_THRESHOLD: 0.5,
  MAX_SIMILAR_MEMORIES: 5,
  MEMORY_SAVE_INTERVAL: 10, // Changed from 5 to 10
  MEMORY_SUMMARIZATION_INTERVAL: 10, // Every 10th update (100 messages)
  MAX_KEY_INSIGHTS_PER_UPDATE: 3, // Max insights extracted per update
  MAX_MEMORY_LENGTH: 200, // Max characters per memory
} as const;
