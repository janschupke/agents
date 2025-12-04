import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ERROR_MESSAGES } from '../constants/error-messages.constants.js';
import { ApiKeyRequiredException } from '../exceptions/index.js';

/**
 * Global exception filter for handling all exceptions
 * Improved to use exception types instead of fragile string matching
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      // HttpException already has proper status and message
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof ApiKeyRequiredException) {
      // Use exception type instead of string matching
      status = HttpStatus.UNAUTHORIZED;
      message = exception.message || ERROR_MESSAGES.INVALID_API_KEY;
    } else if (exception instanceof Error) {
      // Handle generic errors
      message = exception.message || ERROR_MESSAGES.UNKNOWN_ERROR;
      // Log unexpected errors for debugging
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack
      );
    } else {
      // Log unknown error types
      this.logger.error('Unknown exception type:', exception);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
