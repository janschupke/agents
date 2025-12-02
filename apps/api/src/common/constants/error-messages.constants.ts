/**
 * Centralized error messages and magic strings
 */

export const ERROR_MESSAGES = {
  UNKNOWN_ERROR: 'Unknown error',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  
  // Validation errors
  MESSAGE_REQUIRED: 'Message is required',
  API_KEY_REQUIRED: 'API key is required',
  RULES_MUST_BE_ARRAY: 'Rules must be an array',
  
  // Not found errors
  MEMORY_NOT_FOUND: 'Memory not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  
  // Access errors
  ACCESS_DENIED: 'Access denied',
  INVALID_API_KEY: 'Invalid API key. Please check your .env file.',
  OPENAI_API_KEY_REQUIRED: 'OpenAI API key is required for summarization',
} as const;

export const MAGIC_STRINGS = {
  // User roles
  DEFAULT_USER_ROLE: 'user',
  
  // API provider names
  OPENAI_PROVIDER: 'openai',
  
  // Parse base
  PARSE_INT_BASE: 10,
} as const;
