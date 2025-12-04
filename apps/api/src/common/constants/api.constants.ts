import { NUMERIC_CONSTANTS } from './numeric.constants.js';
import { OPENAI_MODELS, OPENAI_MODEL_PRICING } from '@openai/shared-types';

// Re-export for backward compatibility
export { OPENAI_MODELS, OPENAI_MODEL_PRICING };

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
