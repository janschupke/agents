import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SavedWord, SavedWordSentence, Prisma } from '@prisma/client';

@Injectable()
export class SavedWordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    originalWord: string;
    translation: string;
    pinyin?: string;
    agentId?: number;
    sessionId?: number;
    sentence?: string;
    messageId?: number;
  }): Promise<SavedWord> {
    const { sentence, messageId, ...wordData } = data;

    const savedWord = await this.prisma.savedWord.create({
      data: {
        ...wordData,
        sentences: sentence
          ? {
              create: {
                sentence,
                messageId,
              },
            }
          : undefined,
      },
      include: {
        sentences: true,
      },
    });

    return savedWord;
  }

  async findById(id: number, userId: string): Promise<SavedWord | null> {
    return this.prisma.savedWord.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        sentences: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        agent: {
          select: {
            name: true,
          },
        },
        session: {
          select: {
            sessionName: true,
          },
        },
      },
    });
  }

  async findByWord(
    userId: string,
    originalWord: string
  ): Promise<SavedWord | null> {
    return this.prisma.savedWord.findFirst({
      where: {
        userId,
        originalWord: {
          equals: originalWord,
          mode: 'insensitive',
        },
      },
      include: {
        sentences: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async findAllByUserId(userId: string): Promise<SavedWord[]> {
    return this.prisma.savedWord.findMany({
      where: {
        userId,
      },
      include: {
        sentences: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        agent: {
          select: {
            name: true,
          },
        },
        session: {
          select: {
            sessionName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllByLanguage(
    userId: string,
    language?: string
  ): Promise<SavedWord[]> {
    const where: Prisma.SavedWordWhereInput = {
      userId,
    };

    if (language) {
      // Find all agents with this language
      const agentsWithLanguage = await this.prisma.agent.findMany({
        where: {
          userId,
          language: {
            equals: language,
          },
        },
        select: { id: true },
      });

      const agentIds = agentsWithLanguage.map((agent) => agent.id);

      if (agentIds.length > 0) {
        // Filter words by agents with this language
        where.agentId = { in: agentIds };
      } else {
        // No agents with this language, return empty array
        return [];
      }
    }

    return this.prisma.savedWord.findMany({
      where,
      include: {
        sentences: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        agent: {
          select: {
            name: true,
          },
        },
        session: {
          select: {
            sessionName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findMatchingWords(
    userId: string,
    words: string[]
  ): Promise<SavedWord[]> {
    if (words.length === 0) {
      return [];
    }

    // Case-insensitive matching using Prisma's mode: 'insensitive'
    // Note: Prisma doesn't support case-insensitive IN queries directly,
    // so we use OR conditions with mode: 'insensitive'
    const whereConditions: Prisma.SavedWordWhereInput[] = words.map((word) => ({
      userId,
      originalWord: {
        equals: word,
        mode: 'insensitive',
      },
    }));

    return this.prisma.savedWord.findMany({
      where: {
        OR: whereConditions,
      },
      include: {
        sentences: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        agent: {
          select: {
            name: true,
          },
        },
        session: {
          select: {
            sessionName: true,
          },
        },
      },
    });
  }

  async update(
    id: number,
    userId: string,
    data: {
      translation?: string;
      pinyin?: string;
    }
  ): Promise<SavedWord> {
    return this.prisma.savedWord.update({
      where: {
        id,
        userId,
      },
      data,
      include: {
        sentences: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        agent: {
          select: {
            name: true,
          },
        },
        session: {
          select: {
            sessionName: true,
          },
        },
      },
    });
  }

  async delete(id: number, userId: string): Promise<void> {
    await this.prisma.savedWord.delete({
      where: {
        id,
        userId,
      },
    });
  }

  async addSentence(
    savedWordId: number,
    sentence: string,
    messageId?: number
  ): Promise<SavedWordSentence> {
    return this.prisma.savedWordSentence.create({
      data: {
        savedWordId,
        sentence,
        messageId,
      },
    });
  }

  async removeSentence(sentenceId: number, savedWordId: number): Promise<void> {
    await this.prisma.savedWordSentence.delete({
      where: {
        id: sentenceId,
        savedWordId,
      },
    });
  }
}
