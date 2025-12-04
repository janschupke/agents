import { BadRequestException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../constants/error-messages.constants';

/**
 * Exception thrown when an API key is required but not provided
 */
export class ApiKeyRequiredException extends BadRequestException {
  constructor() {
    super(ERROR_MESSAGES.OPENAI_API_KEY_REQUIRED);
  }
}
