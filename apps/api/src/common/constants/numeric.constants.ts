/**
 * Centralized numeric constants (magic numbers) for API
 * Shared UI constants are imported from @openai/shared-types
 */

import { NUMERIC_CONSTANTS as SHARED_NUMERIC_CONSTANTS } from '@openai/shared-types';

export const NUMERIC_CONSTANTS = {
  // Re-export shared constants
  ...SHARED_NUMERIC_CONSTANTS,

  // API-specific constants
  // Embedding dimensions
  EMBEDDING_DIMENSIONS: 1536,

  // OpenAI API defaults
  DEFAULT_TEMPERATURE: 0.7,
  TRANSLATION_TEMPERATURE: 0.3,
  DEFAULT_MAX_TOKENS: 1000,
  MEMORY_EXTRACTION_MAX_TOKENS: 300,
  MEMORY_SUMMARIZATION_MAX_TOKENS: 150,
  MEMORY_SUMMARY_MAX_TOKENS: 300, // Max tokens for memory summary generation (4-5 sentences)
  MEMORY_SUMMARY_MAX_LENGTH: 800, // Max characters for memory summary display
  MEMORY_SUMMARY_REFRESH_INTERVAL: 20, // Number of messages before refreshing memory summary

  // Memory similarity
  MEMORY_SIMILARITY_THRESHOLD: 0.8,

  // Context limits
  TRANSLATION_CONTEXT_MESSAGES: 10,
  MEMORY_EXTRACTION_MESSAGES: 5,
  MEMORY_SUMMARIZATION_LIMIT: 100,
  OPENAI_CHAT_CONTEXT_MESSAGES: 20, // Number of conversation messages (user/assistant pairs) to include in OpenAI requests
  OPENAI_HELPER_CONTEXT_MESSAGES: 6, // Number of messages (3 user + 3 assistant) for helper methods (memory extraction, word parsing, etc.)

  // Pagination defaults (API-specific)
  MAX_PAGE_SIZE: 1000,
} as const;
