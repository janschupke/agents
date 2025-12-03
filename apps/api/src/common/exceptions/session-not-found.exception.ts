import { NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../constants/error-messages.constants';

/**
 * Exception thrown when a session is not found
 */
export class SessionNotFoundException extends NotFoundException {
  constructor(sessionId?: number) {
    super(
      sessionId
        ? `Session with ID ${sessionId} not found`
        : ERROR_MESSAGES.SESSION_NOT_FOUND
    );
  }
}
