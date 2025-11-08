import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Message, Prisma } from '@prisma/client';

export interface MessageForOpenAI {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    sessionId: number,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, unknown>,
    rawRequest?: unknown,
    rawResponse?: unknown
  ): Promise<Message> {
    return this.prisma.message.create({
      data: {
        sessionId,
        role,
        content,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
        rawRequest: rawRequest ? (rawRequest as Prisma.InputJsonValue) : undefined,
        rawResponse: rawResponse ? (rawResponse as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async findAllBySessionId(
    sessionId: number,
    limit?: number
  ): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages;
  }

  async findAllBySessionIdForOpenAI(
    sessionId: number,
    limit?: number
  ): Promise<MessageForOpenAI[]> {
    const messages = await this.findAllBySessionId(sessionId, limit);
    return messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));
  }

  async findAllBySessionIdWithRawData(
    sessionId: number,
    limit?: number
  ): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }
}
