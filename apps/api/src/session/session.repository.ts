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

  /**
   * Gets the activity date for a session.
   * For sessions with messages, this is the last message date.
   * For empty sessions, this is the creation date.
   * This allows empty sessions to be freshest only if their creation is more recent
   * than any other session's last message.
   */
  private getSessionActivityDate(
    session: ChatSession & { messages?: { createdAt: Date }[] }
  ): Date {
    return session.messages?.[0]?.createdAt || session.createdAt;
  }

  async findAllByAgentId(
    agentId: number,
    userId: string
  ): Promise<ChatSession[]> {
    // Fetch sessions with their latest message to order by activity date
    const sessions = await this.prisma.chatSession.findMany({
      where: { agentId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Only need the latest message
        },
      },
    });

    // Sort by activity date (desc): last message date if exists, otherwise creation date
    // This ensures empty sessions are only freshest if their creation is more recent
    // than any other session's last message date
    const sorted = sessions.sort((a, b) => {
      const aActivityDate = this.getSessionActivityDate(a);
      const bActivityDate = this.getSessionActivityDate(b);
      return bActivityDate.getTime() - aActivityDate.getTime();
    });

    // Return sessions without the messages relation (we only needed it for sorting)
    return sorted.map(({ ...session }) => session);
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
