/**
 * Centralized numeric constants for client package
 * Shared constants are imported from @openai/shared-types
 */

import { NUMERIC_CONSTANTS as SHARED_NUMERIC_CONSTANTS } from '@openai/shared-types';

// Re-export shared constants for backward compatibility
export const NUMERIC_CONSTANTS = {
  ...SHARED_NUMERIC_CONSTANTS,
} as const;
