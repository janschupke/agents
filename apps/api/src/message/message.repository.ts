import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Message, Prisma } from '@prisma/client';
import { MessageRole } from '../common/enums/message-role.enum';
import { MessageMetadata } from '../common/types/config.types';

interface MessageForOpenAI {
  role: MessageRole;
  content: string;
}

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    sessionId: number,
    role: MessageRole,
    content: string,
    metadata?: MessageMetadata,
    rawRequest?: unknown,
    rawResponse?: unknown
  ): Promise<Message> {
    // Use transaction to create message and update session.lastMessageAt atomically
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
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

      // Update session's lastMessageAt denormalized field
      await tx.chatSession.update({
        where: { id: sessionId },
        data: {
          lastMessageAt: message.createdAt,
          updatedAt: new Date(),
        },
      });

      return message;
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
      role: msg.role as MessageRole,
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

  /**
   * Get the most recent messages for initial chat load
   * Returns messages in chronological order (oldest first) for consistency
   * @param sessionId - Session ID
   * @param limit - Number of messages to return (default: 20)
   * @returns Object with messages and hasMore flag
   */
  async findRecentMessagesBySessionId(
    sessionId: number,
    limit: number = 20
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    // Get one extra message to check if there are more
    const messages = await this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { id: 'desc' }, // Newest first (highest ID first)
      take: limit + 1, // Get one extra to check hasMore
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

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;

    // Reverse to get chronological order (oldest first) for consistency
    return {
      messages: resultMessages.reverse(),
      hasMore,
    };
  }

  /**
   * Get messages with cursor-based pagination
   * Returns messages in chronological order (oldest first) for consistency
   * - Initial load (no cursor): Get newest 20 messages, reverse to oldest first
   * - Pagination (with cursor): Get messages older than cursor (id < cursor), reverse to oldest first
   */
  async findAllBySessionIdWithCursor(
    sessionId: number,
    limit: number = 20,
    cursor?: number
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    // For initial load (no cursor), get newest messages
    // For pagination (with cursor), get messages older than cursor
    const whereClause: Prisma.MessageWhereInput = cursor
      ? {
          sessionId,
          id: {
            lt: cursor, // Get messages with ID less than cursor (older messages)
          },
        }
      : { sessionId };

    // Get one extra message to check if there are more
    // Order by id DESC to get newest messages first (works for both initial and pagination)
    // Since IDs are auto-incrementing, id DESC gives us newest first
    const messages = await this.prisma.message.findMany({
      where: whereClause,
      orderBy: { id: 'desc' }, // Newest first (highest ID first)
      take: limit + 1, // Get one extra to check hasMore
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

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;

    // Reverse to get chronological order (oldest first) for consistency
    // This ensures messages are always returned in chronological order
    return {
      messages: resultMessages.reverse(),
      hasMore,
    };
  }

  async findById(messageId: number): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: { id: messageId },
    });
  }
}
