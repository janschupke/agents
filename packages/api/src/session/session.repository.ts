import { Injectable } from '@nestjs/common';
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
    return this.prisma.chatSession.findFirst({
      where: { agentId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByAgentId(
    agentId: number,
    userId: string
  ): Promise<ChatSession[]> {
    return this.prisma.chatSession.findMany({
      where: { agentId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    id: number,
    userId: string,
    sessionName?: string
  ): Promise<ChatSession> {
    // Verify the session belongs to the user before updating
    const session = await this.findByIdAndUserId(id, userId);
    if (!session) {
      throw new Error('Session not found'); // Will be handled by service
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
