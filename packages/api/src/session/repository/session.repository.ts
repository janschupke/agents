import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatSession } from '@prisma/client';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    botId: number,
    sessionName?: string,
  ): Promise<ChatSession> {
    return this.prisma.chatSession.create({
      data: {
        userId,
        botId,
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
    userId: string,
  ): Promise<ChatSession | null> {
    const perfStart = Date.now();
    // Use findFirst with compound where for better index usage
    const result = await this.prisma.chatSession.findFirst({
      where: { 
        id,
        userId,
      },
    });
    const perfTime = Date.now() - perfStart;
    if (perfTime > 50) {
      console.log(`[Performance] SessionRepository.findByIdAndUserId took ${perfTime}ms for session ${id}`);
    }
    return result;
  }

  async findLatestByBotId(
    botId: number,
    userId: string,
  ): Promise<ChatSession | null> {
    return this.prisma.chatSession.findFirst({
      where: { botId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByBotId(
    botId: number,
    userId: string,
  ): Promise<ChatSession[]> {
    return this.prisma.chatSession.findMany({
      where: { botId, userId },
      orderBy: { createdAt: 'desc' },
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
