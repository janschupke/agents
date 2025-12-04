import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../constants/error-messages.constants';

/**
 * Exception thrown when an API key is not found
 */
class ApiKeyNotFoundException extends NotFoundException {
  constructor(provider?: string) {
    super(
      provider
        ? `API key for provider ${provider} not found`
        : ERROR_MESSAGES.API_KEY_NOT_FOUND
    );
  }
}

/**
 * Exception thrown when an API key is required but not provided
 */
export class ApiKeyRequiredException extends BadRequestException {
  constructor() {
    super(ERROR_MESSAGES.OPENAI_API_KEY_REQUIRED);
  }
}
