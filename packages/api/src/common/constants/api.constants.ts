export const API_PREFIX = 'api';

export const DEFAULT_BOT_CONFIG = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 1000,
  system_prompt: 'You are a helpful assistant.',
} as const;

export const MEMORY_CONFIG = {
  SIMILARITY_THRESHOLD: 0.5, // Lower threshold to find more relevant memories
  MAX_SIMILAR_MEMORIES: 5, // Increased to get more context
  MEMORY_SAVE_INTERVAL: 5, // Save more frequently for better memory persistence
} as const;
