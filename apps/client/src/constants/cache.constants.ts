/**
 * Cache time constants for React Query
 * All times are in milliseconds
 */

// Base cache times
const MINUTE = 60 * 1000;

/**
 * Default staleTime for all queries
 * Data stays fresh for this duration before being considered stale
 */
export const DEFAULT_STALE_TIME = 10 * MINUTE; // 10 minutes

/**
 * Default gcTime (garbage collection time) for all queries
 * Unused data is kept in cache for this duration
 */
export const DEFAULT_GC_TIME = 30 * MINUTE; // 30 minutes

/**
 * Query-specific staleTime values
 * These override the default for specific query types
 */

// Agents - rarely change, can be cached longer
export const AGENTS_STALE_TIME = 15 * MINUTE; // 15 minutes

// Sessions - moderate change frequency
export const SESSIONS_STALE_TIME = 5 * MINUTE; // 5 minutes

// Chat History - can be invalidated on new messages
export const CHAT_HISTORY_STALE_TIME = 5 * MINUTE; // 5 minutes

// User/API Key - frequently checked, shorter cache
export const USER_STALE_TIME = 30 * 1000; // 30 seconds
