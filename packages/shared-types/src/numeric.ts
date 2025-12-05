/**
 * Shared numeric constants used across client, admin, and API
 * UI-related constants that are common to frontend and backend
 */

export const NUMERIC_CONSTANTS = {
  // Timeouts (milliseconds)
  UI_DEBOUNCE_DELAY: 100,
  UI_NOTIFICATION_DURATION: 3000,
  UI_MODAL_DELAY: 200,
  CACHE_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes

  // Retry delays (milliseconds)
  RETRY_DELAY_SHORT: 50,
  RETRY_DELAY_MEDIUM: 100,
  RETRY_DELAY_LONG: 150,
  RETRY_DELAY_VERY_LONG: 300,

  // Polling intervals (milliseconds)
  POLLING_INTERVAL_START: 1000, // 1 second

  // File upload limits
  MAX_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB in bytes

  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_PAGE: 1,

  // Port numbers
  DEFAULT_API_PORT: 3001,
  DEFAULT_CLIENT_PORT: 3000,
  DEFAULT_DB_PORT: 5432,
  DEFAULT_DB_POOLER_PORT: 6543,

  // Age limits
  AGE_MIN: 0,
  AGE_MAX: 100,
  AGE_YOUNG_THRESHOLD: 30,

  // Temperature
  TEMPERATURE_MIN: 0,
  TEMPERATURE_MAX: 2,
  TEMPERATURE_DEFAULT: 0.7,
  TEMPERATURE_TRANSLATION: 0.3,

  // Text limits
  TEXT_TRUNCATE_DEFAULT: 100,
  TEXT_TRUNCATE_LONG: 1000,

  // Scroll delays (milliseconds)
  SCROLL_DELAY_SHORT: 150,
  SCROLL_DELAY_MEDIUM: 300,
  SCROLL_DELAY_LONG: 600,
  SCROLL_DELAY_VERY_LONG: 1000,
} as const;
