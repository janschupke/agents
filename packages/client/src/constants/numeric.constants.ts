/**
 * Centralized numeric constants for client package
 */

export const NUMERIC_CONSTANTS = {
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
} as const;
