import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Message, Prisma } from '@prisma/client';

interface MessageForOpenAI {
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
        rawRequest: rawRequest
          ? (rawRequest as Prisma.InputJsonValue)
          : undefined,
        rawResponse: rawResponse
          ? (rawResponse as Prisma.InputJsonValue)
          : undefined,
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
    // Default limit to prevent loading too many messages at once
    // This prevents performance issues with large JSON fields (rawRequest/rawResponse)
    const effectiveLimit = limit || 1000;

    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: effectiveLimit,
      // Select only needed fields to reduce data transfer
      select: {
        id: true,
        sessionId: true,
        role: true,
        content: true,
        metadata: true,
        rawRequest: true,
        rawResponse: true,
        createdAt: true,
      },
    });
  }

  async findById(messageId: number): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: { id: messageId },
    });
  }
}
