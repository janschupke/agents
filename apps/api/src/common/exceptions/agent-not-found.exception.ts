import { NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../constants/error-messages.constants';

/**
 * Exception thrown when an agent is not found
 */
export class AgentNotFoundException extends NotFoundException {
  constructor(agentId?: number) {
    super(
      agentId
        ? `Agent with ID ${agentId} not found`
        : ERROR_MESSAGES.AGENT_NOT_FOUND
    );
  }
}
