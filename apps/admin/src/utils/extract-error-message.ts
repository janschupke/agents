/**
 * Extracts a user-friendly error message from an unknown error object
 * @param error - The error object (can be any type)
 * @param defaultMessage - Default message to return if error cannot be parsed
 * @returns A string error message
 */
export function extractErrorMessage(
  error: unknown,
  defaultMessage: string
): string {
  if (!error) {
    return defaultMessage;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  // Handle objects with message property
  if (
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  // Handle objects with status property (HTTP errors)
  if (
    typeof error === 'object' &&
    'status' in error &&
    typeof error.status === 'number'
  ) {
    if (error.status === 403) {
      return 'Access denied';
    }
    if (error.status === 401) {
      return 'Unauthorized';
    }
    if (error.status === 404) {
      return 'Not found';
    }
    if (error.status >= 500) {
      return 'Server error';
    }
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
}
