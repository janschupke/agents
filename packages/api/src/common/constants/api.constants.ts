export const API_PREFIX = 'api';

export const DEFAULT_BOT_CONFIG = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 1000,
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
