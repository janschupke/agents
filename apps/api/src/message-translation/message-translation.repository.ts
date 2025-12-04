import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageTranslation } from '@prisma/client';

@Injectable()
export class MessageTranslationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    messageId: number,
    translation: string
  ): Promise<MessageTranslation> {
    return this.prisma.messageTranslation.create({
      data: {
        messageId,
        translation,
      },
    });
  }

  async findByMessageId(messageId: number): Promise<MessageTranslation | null> {
    return this.prisma.messageTranslation.findUnique({
      where: { messageId },
    });
  }

  async findByMessageIds(messageIds: number[]): Promise<MessageTranslation[]> {
    return this.prisma.messageTranslation.findMany({
      where: {
        messageId: { in: messageIds },
      },
    });
  }

  async update(
    messageId: number,
    translation: string
  ): Promise<MessageTranslation> {
    return this.prisma.messageTranslation.update({
      where: { messageId },
      data: { translation },
    });
  }
}
