import { Injectable, Logger } from '@nestjs/common';
import { AgentRepository } from '../agent/agent.repository';
import { SessionRepository } from './session.repository';
import {
  SessionResponseDto,
  SessionWithAgentResponseDto,
} from '../common/dto/chat.dto';
import {
  AgentNotFoundException,
  SessionNotFoundException,
} from '../common/exceptions';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly sessionRepository: SessionRepository
  ) {}

  async getSessions(
    agentId: number,
    userId: string
  ): Promise<SessionResponseDto[]> {
    this.logger.debug(`Getting sessions for agent ${agentId}, user ${userId}`);
    // Load agent with config
    const agent = await this.agentRepository.findByIdWithConfig(
      agentId,
      userId
    );
    if (!agent) {
      this.logger.warn(`Agent ${agentId} not found for user ${userId}`);
      throw new AgentNotFoundException(agentId);
    }

    // Get all sessions for this agent and user
    const sessions = await this.sessionRepository.findAllByAgentId(
      agentId,
      userId
    );
    this.logger.debug(`Found ${sessions.length} sessions for agent ${agentId}`);

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
    this.logger.log(`Creating session for agent ${agentId}, user ${userId}`);
    // User is automatically synced to DB by ClerkGuard

    // Load agent with config
    const agent = await this.agentRepository.findByIdWithConfig(
      agentId,
      userId
    );
    if (!agent) {
      this.logger.warn(`Agent ${agentId} not found for user ${userId}`);
      throw new AgentNotFoundException(agentId);
    }

    // Create new session
    const session = await this.sessionRepository.create(userId, agentId);
    this.logger.log(`Created session ${session.id} for agent ${agentId}`);

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
    this.logger.log(
      `Updating session ${sessionId} for agent ${agentId}, user ${userId}`
    );
    // Verify the agent belongs to the user
    const agent = await this.agentRepository.findByIdAndUserId(agentId, userId);
    if (!agent) {
      this.logger.warn(`Agent ${agentId} not found for user ${userId}`);
      throw new AgentNotFoundException(agentId);
    }

    // Verify the session belongs to the agent and user
    const session = await this.sessionRepository.findByIdAndUserId(
      sessionId,
      userId
    );
    if (!session) {
      throw new SessionNotFoundException(sessionId);
    }

    if (session.agentId !== agentId) {
      this.logger.warn(
        `Session ${sessionId} does not belong to agent ${agentId}`
      );
      throw new SessionNotFoundException(sessionId);
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
    this.logger.log(
      `Deleting session ${sessionId} for agent ${agentId}, user ${userId}`
    );
    // Verify the agent belongs to the user
    const agent = await this.agentRepository.findByIdAndUserId(agentId, userId);
    if (!agent) {
      this.logger.warn(`Agent ${agentId} not found for user ${userId}`);
      throw new AgentNotFoundException(agentId);
    }

    // Verify the session belongs to the agent and user
    const session = await this.sessionRepository.findByIdAndUserId(
      sessionId,
      userId
    );
    if (!session) {
      throw new SessionNotFoundException(sessionId);
    }

    if (session.agentId !== agentId) {
      this.logger.warn(
        `Session ${sessionId} does not belong to agent ${agentId}`
      );
      throw new SessionNotFoundException(sessionId);
    }

    // Delete the session - Prisma will cascade delete all related data (messages, memory chunks)
    await this.sessionRepository.delete(sessionId, userId);
  }

  async getSessionWithAgent(
    sessionId: number,
    userId: string
  ): Promise<SessionWithAgentResponseDto> {
    this.logger.debug(
      `Getting session ${sessionId} with agent for user ${userId}`
    );
    // Get session and verify it belongs to the user
    const session = await this.sessionRepository.findByIdAndUserId(
      sessionId,
      userId
    );
    if (!session) {
      this.logger.warn(`Session ${sessionId} not found for user ${userId}`);
      throw new SessionNotFoundException(sessionId);
    }

    return {
      session: {
        id: session.id,
        session_name: session.sessionName,
        createdAt: session.createdAt,
      },
      agentId: session.agentId,
    };
  }
}
