import { ApiError } from '../services/axios-instance';

export type ErrorType = 'network' | 'validation' | 'server' | 'authentication' | 'unknown';

export interface ParsedError {
  message: string;
  type: ErrorType;
  status?: number;
  data?: unknown;
}

/**
 * Extract and parse error from API errors
 */
export function parseError(error: unknown): ParsedError {
  // Handle ApiError from axios interceptor
  if (error && typeof error === 'object' && 'message' in error) {
    const apiError = error as ApiError;
    const status = apiError.status;

    let type: ErrorType = 'unknown';
    if (status === 401 || status === 403) {
      type = 'authentication';
    } else if (status === 400 || status === 422) {
      type = 'validation';
    } else if (status && status >= 500) {
      type = 'server';
    } else if (status === 0 || !status) {
      type = 'network';
    }

    return {
      message: apiError.message || 'An unexpected error occurred',
      type,
      status,
      data: apiError.data,
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      type: 'unknown',
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      type: 'unknown',
    };
  }

  // Fallback
  return {
    message: 'An unexpected error occurred',
    type: 'unknown',
  };
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  const parsed = parseError(error);
  return parsed.message;
}

/**
 * Check if error is expected (e.g., 401 when not authenticated)
 */
export function isExpectedError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'expected' in error) {
    return (error as ApiError).expected === true;
  }
  return false;
}

