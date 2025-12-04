/**
 * Authentication utility functions
 */

import { MAGIC_STRINGS } from '@openai/shared-types';

/**
 * Extract Bearer token from Authorization header
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns The token without the "Bearer " prefix, or null if invalid
 */
export function extractBearerToken(authHeader: string | undefined | null): string | null {
  if (!authHeader) {
    return null;
  }

  if (!authHeader.startsWith(MAGIC_STRINGS.BEARER_TOKEN_PREFIX)) {
    return null;
  }

  const token = authHeader.replace(MAGIC_STRINGS.BEARER_TOKEN_PREFIX, '').trim();
  return token || null;
}
