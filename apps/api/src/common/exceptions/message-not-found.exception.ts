import { NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../constants/error-messages.constants';

/**
 * Exception thrown when a message is not found
 */
export class MessageNotFoundException extends NotFoundException {
  constructor(messageId?: number) {
    super(
      messageId
        ? `Message with ID ${messageId} not found`
        : ERROR_MESSAGES.MESSAGE_NOT_FOUND
    );
  }
}
