import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SortOrder } from '@openai/shared-types';

export interface WordTranslation {
  originalWord: string;
  translation: string;
  sentenceContext?: string;
}

@Injectable()
export class MessageWordTranslationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create word translations for a message
   */
  async createMany(
    messageId: number,
    wordTranslations: WordTranslation[],
    sentenceContexts: Map<string, string> // Map of word -> sentence
  ) {
    return this.prisma.messageWordTranslation.createMany({
      data: wordTranslations.map((wt) => ({
        messageId,
        originalWord: wt.originalWord,
        translation: wt.translation,
        sentenceContext:
          wt.sentenceContext || sentenceContexts.get(wt.originalWord),
      })),
    });
  }

  /**
   * Get all word translations for a message
   */
  async findByMessageId(messageId: number) {
    return this.prisma.messageWordTranslation.findMany({
      where: { messageId },
      orderBy: { id: SortOrder.ASC }, // Order by insertion order
    });
  }

  /**
   * Get word translations for multiple messages
   */
  async findByMessageIds(messageIds: number[]) {
    if (messageIds.length === 0) {
      return [];
    }
    return this.prisma.messageWordTranslation.findMany({
      where: {
        messageId: { in: messageIds },
      },
      orderBy: [{ messageId: SortOrder.ASC }, { id: SortOrder.ASC }],
    });
  }

  /**
   * Check if word translations exist for a message
   */
  async existsForMessage(messageId: number): Promise<boolean> {
    const count = await this.prisma.messageWordTranslation.count({
      where: { messageId },
    });
    return count > 0;
  }

  /**
   * Delete all word translations for a message
   */
  async deleteByMessageId(messageId: number): Promise<void> {
    await this.prisma.messageWordTranslation.deleteMany({
      where: { messageId },
    });
  }
}
