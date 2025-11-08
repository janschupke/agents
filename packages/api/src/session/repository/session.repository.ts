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
    return this.prisma.chatSession.findFirst({
      where: { id, userId },
    });
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
}
