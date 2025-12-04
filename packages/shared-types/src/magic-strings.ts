/**
 * Magic strings - shared string constants used across apps
 * These are values that should be consistent across client, admin, and API
 */

export const MAGIC_STRINGS = {
  // User roles
  DEFAULT_USER_ROLE: 'user',

  // API provider names
  OPENAI_PROVIDER: 'openai',

  // Parse base
  PARSE_INT_BASE: 10,
} as const;
