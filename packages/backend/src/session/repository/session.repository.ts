import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatSession } from '@prisma/client';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(botId: number, sessionName?: string): Promise<ChatSession> {
    return this.prisma.chatSession.create({
      data: {
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

  async findLatestByBotId(botId: number): Promise<ChatSession | null> {
    return this.prisma.chatSession.findFirst({
      where: { botId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByBotId(botId: number): Promise<ChatSession[]> {
    return this.prisma.chatSession.findMany({
      where: { botId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
