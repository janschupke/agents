/**
 * HTTP status codes - shared constants used across apps
 * These are values that should be consistent across client, admin, and API
 */

export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,

  // Server errors
  INTERNAL_SERVER_ERROR: 500,
} as const;
