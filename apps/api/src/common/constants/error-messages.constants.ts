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
  API_KEY_CANNOT_BE_EMPTY: 'API key cannot be empty',
  AGENT_NAME_REQUIRED: 'Agent name is required',

  // Not found errors
  MEMORY_NOT_FOUND: 'Memory not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  AGENT_NOT_FOUND: 'Agent not found',
  SESSION_NOT_FOUND: 'Session not found',
  API_KEY_NOT_FOUND: 'API key not found',
  USER_NOT_FOUND: 'User not found',

  // Access errors
  ACCESS_DENIED: 'Access denied',
  SESSION_ACCESS_DENIED: 'Access denied: Session not found',
  SESSION_DOES_NOT_BELONG_TO_AGENT: 'Session does not belong to this agent',
  INVALID_API_KEY: 'Invalid API key. Please check your .env file.',
  OPENAI_API_KEY_REQUIRED:
    'OpenAI API key is required. Please set your API key in your profile.',
  OPENAI_API_KEY_REQUIRED_FOR_SUMMARIZATION:
    'OpenAI API key is required for summarization',

  // OpenAI errors
  NO_RESPONSE_FROM_OPENAI: 'No response from OpenAI',
  TRANSLATION_FAILED: 'Translation failed',

  // Conflict errors
  AGENT_NAME_ALREADY_EXISTS: 'Agent with this name already exists',

  // Server errors
  FAILED_TO_SAVE_API_KEY: 'Failed to save API key',
  FAILED_TO_DECRYPT_API_KEY: 'Failed to decrypt API key',
  FAILED_TO_CREATE_AGENT_MEMORY:
    'Failed to create agent memory: no result returned',
} as const;

export const MAGIC_STRINGS = {
  // User roles
  DEFAULT_USER_ROLE: 'user',

  // API provider names
  OPENAI_PROVIDER: 'openai',

  // Parse base
  PARSE_INT_BASE: 10,
} as const;
