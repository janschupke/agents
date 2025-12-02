import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatSession } from '@prisma/client';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    agentId: number,
    sessionName?: string
  ): Promise<ChatSession> {
    return this.prisma.chatSession.create({
      data: {
        userId,
        agentId,
        sessionName: sessionName || null,
      },
    });
  }

  async findById(id: number): Promise<ChatSession | null> {
    return this.prisma.chatSession.findUnique({
      where: { id },
    });
  }

  async findByIdAndUserId(
    id: number,
    userId: string
  ): Promise<ChatSession | null> {
    // Use findFirst with compound where for better index usage
    return this.prisma.chatSession.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async findLatestByAgentId(
    agentId: number,
    userId: string
  ): Promise<ChatSession | null> {
    // Get all sessions ordered by last message date, then return the first one
    const sessions = await this.findAllByAgentId(agentId, userId);
    return sessions.length > 0 ? sessions[0] : null;
  }


  async findAllByAgentId(
    agentId: number,
    userId: string
  ): Promise<ChatSession[]> {
    // Optimized: Use a subquery to get latest message date for each session
    // This avoids loading all message data just for sorting
    const sessionsWithActivity = await this.prisma.$queryRawUnsafe<
      Array<{
        id: number;
        user_id: string;
        agent_id: number;
        session_name: string | null;
        created_at: Date;
        updated_at: Date;
        last_message_at: Date | null;
      }>
    >(
      `SELECT 
        cs.id,
        cs.user_id,
        cs.agent_id,
        cs.session_name,
        cs.created_at,
        cs.updated_at,
        (
          SELECT MAX(m.created_at)
          FROM messages m
          WHERE m.session_id = cs.id
        ) as last_message_at
      FROM chat_sessions cs
      WHERE cs.agent_id = $1 AND cs.user_id = $2
      ORDER BY 
        COALESCE(
          (SELECT MAX(m.created_at) FROM messages m WHERE m.session_id = cs.id),
          cs.created_at
        ) DESC`,
      agentId,
      userId
    );

    // Map back to ChatSession format
    return sessionsWithActivity.map((row) => ({
      id: row.id,
      userId: row.user_id,
      agentId: row.agent_id,
      sessionName: row.session_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async update(
    id: number,
    userId: string,
    sessionName?: string
  ): Promise<ChatSession> {
    // Verify the session belongs to the user before updating
    const session = await this.findByIdAndUserId(id, userId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.prisma.chatSession.update({
      where: { id },
      data: {
        sessionName: sessionName || null,
      },
    });
  }

  async delete(id: number, userId: string): Promise<void> {
    // Verify the session belongs to the user before deleting
    const session = await this.findByIdAndUserId(id, userId);
    if (!session) {
      return; // Will be handled by service
    }

    // Delete the session - Prisma will cascade delete all related data (messages, memory chunks)
    await this.prisma.chatSession.delete({
      where: { id },
    });
  }
}
