import { NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../constants/error-messages.constants';

/**
 * Exception thrown when a memory is not found
 */
export class MemoryNotFoundException extends NotFoundException {
  constructor(memoryId?: number) {
    super(
      memoryId
        ? `Memory with ID ${memoryId} not found`
        : ERROR_MESSAGES.MEMORY_NOT_FOUND
    );
  }
}
