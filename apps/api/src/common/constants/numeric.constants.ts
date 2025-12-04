/**
 * Centralized numeric constants (magic numbers)
 */

export const NUMERIC_CONSTANTS = {
  // Embedding dimensions
  EMBEDDING_DIMENSIONS: 1536,

  // OpenAI API defaults
  DEFAULT_TEMPERATURE: 0.7,
  TRANSLATION_TEMPERATURE: 0.3,
  DEFAULT_MAX_TOKENS: 1000,
  MEMORY_EXTRACTION_MAX_TOKENS: 300,
  MEMORY_SUMMARIZATION_MAX_TOKENS: 150,

  // Memory similarity
  MEMORY_SIMILARITY_THRESHOLD: 0.8,

  // Context limits
  TRANSLATION_CONTEXT_MESSAGES: 10,
  MEMORY_EXTRACTION_MESSAGES: 10,
  MEMORY_SUMMARIZATION_LIMIT: 100,
  OPENAI_CHAT_CONTEXT_MESSAGES: 20, // Number of conversation messages (user/assistant pairs) to include in OpenAI requests

  // Timeouts (milliseconds)
  UI_DEBOUNCE_DELAY: 100,
  UI_NOTIFICATION_DURATION: 3000,
  UI_MODAL_DELAY: 200,
  CACHE_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes

  // Polling intervals (milliseconds)
  POLLING_INTERVAL_START: 1000, // 1 second

  // File upload limits
  MAX_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB in bytes

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_PAGE: 1,
  MAX_PAGE_SIZE: 1000,
} as const;
