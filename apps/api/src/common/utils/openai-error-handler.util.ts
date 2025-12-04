import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ERROR_MESSAGES } from '../constants/error-messages.constants';

/**
 * Utility for handling OpenAI API errors consistently
 * Centralizes error handling logic used across multiple services
 */
export class OpenAIErrorHandler {
  private static readonly logger = new Logger(OpenAIErrorHandler.name);

  /**
   * Handle OpenAI API errors and convert to appropriate HTTP exceptions
   * @param error - The error from OpenAI API call
   * @param context - Optional context for logging (e.g., operation name)
   * @returns HttpException with appropriate status code and message
   */
  static handleError(error: unknown, context?: string): HttpException {
    const errorObj = error as {
      message?: string;
      status?: number;
      code?: string;
    };
    const contextMsg = context ? ` (${context})` : '';

    // Log the error for debugging
    this.logger.error(
      `OpenAI API error${contextMsg}:`,
      errorObj.message || 'Unknown error',
      errorObj
    );

    // Handle API key errors
    if (
      errorObj.message?.includes('API key') ||
      errorObj.message?.includes('Invalid API key') ||
      errorObj.status === 401 ||
      errorObj.code === 'invalid_api_key'
    ) {
      return new HttpException(
        ERROR_MESSAGES.INVALID_API_KEY ||
          'Invalid API key. Please check your API credentials.',
        HttpStatus.UNAUTHORIZED
      );
    }

    // Handle rate limit errors
    if (
      errorObj.message?.includes('rate limit') ||
      errorObj.status === 429 ||
      errorObj.code === 'rate_limit_exceeded'
    ) {
      return new HttpException(
        'Rate limit exceeded. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Handle invalid request errors
    if (
      errorObj.message?.includes('Invalid request') ||
      errorObj.status === 400 ||
      errorObj.code === 'invalid_request_error'
    ) {
      return new HttpException(
        errorObj.message || 'Invalid request to OpenAI API',
        HttpStatus.BAD_REQUEST
      );
    }

    // Handle server errors from OpenAI
    if (
      errorObj.status === 500 ||
      errorObj.status === 502 ||
      errorObj.status === 503
    ) {
      return new HttpException(
        'OpenAI service is temporarily unavailable. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    // Re-throw HttpException as-is (already handled)
    if (error instanceof HttpException) {
      return error;
    }

    // Default to internal server error
    return new HttpException(
      errorObj.message ||
        ERROR_MESSAGES.UNKNOWN_ERROR ||
        'An unexpected error occurred',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  /**
   * Check if error is an API key error
   */
  static isApiKeyError(error: unknown): boolean {
    const errorObj = error as {
      message?: string;
      status?: number;
      code?: string;
    };
    return (
      errorObj.message?.includes('API key') ||
      errorObj.message?.includes('Invalid API key') ||
      errorObj.status === 401 ||
      errorObj.code === 'invalid_api_key'
    );
  }

  /**
   * Check if error is a rate limit error
   */
  static isRateLimitError(error: unknown): boolean {
    const errorObj = error as {
      message?: string;
      status?: number;
      code?: string;
    };
    return (
      errorObj.message?.includes('rate limit') ||
      errorObj.status === 429 ||
      errorObj.code === 'rate_limit_exceeded'
    );
  }
}
