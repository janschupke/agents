import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AgentRepository } from '../agent/agent.repository';
import { SessionRepository } from './session.repository';
import { SessionResponseDto } from '../common/dto/chat.dto';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants.js';

@Injectable()
export class SessionService {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly sessionRepository: SessionRepository
  ) {}

  async getSessions(
    agentId: number,
    userId: string
  ): Promise<SessionResponseDto[]> {
    // Load agent with config
    const agent = await this.agentRepository.findByIdWithConfig(
      agentId,
      userId
    );
    if (!agent) {
      throw new HttpException(
        ERROR_MESSAGES.AGENT_NOT_FOUND,
        HttpStatus.NOT_FOUND
      );
    }

    // Get all sessions for this agent and user
    const sessions = await this.sessionRepository.findAllByAgentId(
      agentId,
      userId
    );

    return sessions.map((session) => ({
      id: session.id,
      session_name: session.sessionName,
      createdAt: session.createdAt,
    }));
  }

  async createSession(
    agentId: number,
    userId: string
  ): Promise<SessionResponseDto> {
    // User is automatically synced to DB by ClerkGuard

    // Load agent with config
    const agent = await this.agentRepository.findByIdWithConfig(
      agentId,
      userId
    );
    if (!agent) {
      throw new HttpException(
        ERROR_MESSAGES.AGENT_NOT_FOUND,
        HttpStatus.NOT_FOUND
      );
    }

    // Create new session
    const session = await this.sessionRepository.create(userId, agentId);

    return {
      id: session.id,
      session_name: session.sessionName,
      createdAt: session.createdAt,
    };
  }

  async updateSession(
    agentId: number,
    sessionId: number,
    userId: string,
    sessionName?: string
  ): Promise<SessionResponseDto> {
    // Verify the agent belongs to the user
    const agent = await this.agentRepository.findByIdAndUserId(agentId, userId);
    if (!agent) {
      throw new HttpException(
        ERROR_MESSAGES.AGENT_NOT_FOUND,
        HttpStatus.NOT_FOUND
      );
    }

    // Verify the session belongs to the agent and user
    const session = await this.sessionRepository.findByIdAndUserId(
      sessionId,
      userId
    );
    if (!session) {
      throw new HttpException(
        ERROR_MESSAGES.SESSION_NOT_FOUND,
        HttpStatus.NOT_FOUND
      );
    }

    if (session.agentId !== agentId) {
      throw new HttpException(
        ERROR_MESSAGES.SESSION_DOES_NOT_BELONG_TO_AGENT,
        HttpStatus.BAD_REQUEST
      );
    }

    // Update the session
    const updated = await this.sessionRepository.update(
      sessionId,
      userId,
      sessionName
    );

    return {
      id: updated.id,
      session_name: updated.sessionName,
      createdAt: updated.createdAt,
    };
  }

  async deleteSession(
    agentId: number,
    sessionId: number,
    userId: string
  ): Promise<void> {
    // Verify the agent belongs to the user
    const agent = await this.agentRepository.findByIdAndUserId(agentId, userId);
    if (!agent) {
      throw new HttpException(
        ERROR_MESSAGES.AGENT_NOT_FOUND,
        HttpStatus.NOT_FOUND
      );
    }

    // Verify the session belongs to the agent and user
    const session = await this.sessionRepository.findByIdAndUserId(
      sessionId,
      userId
    );
    if (!session) {
      throw new HttpException(
        ERROR_MESSAGES.SESSION_NOT_FOUND,
        HttpStatus.NOT_FOUND
      );
    }

    if (session.agentId !== agentId) {
      throw new HttpException(
        ERROR_MESSAGES.SESSION_DOES_NOT_BELONG_TO_AGENT,
        HttpStatus.BAD_REQUEST
      );
    }

    // Delete the session - Prisma will cascade delete all related data (messages, memory chunks)
    await this.sessionRepository.delete(sessionId, userId);
  }
}
