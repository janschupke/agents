import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SavedWordRepository } from './saved-word.repository';
import { PinyinService } from './pinyin.service';
import {
  SavedWordResponseDto,
  SavedWordSentenceResponseDto,
  SavedWordMatchDto,
} from './dto/saved-word.dto';
import { CreateSavedWordDto, UpdateSavedWordDto } from './dto/saved-word.dto';
import type { SavedWord } from '@prisma/client';

@Injectable()
export class SavedWordService {
  private readonly logger = new Logger(SavedWordService.name);

  constructor(
    private readonly savedWordRepository: SavedWordRepository,
    private readonly pinyinService: PinyinService
  ) {}

  async createSavedWord(
    userId: string,
    data: CreateSavedWordDto
  ): Promise<SavedWordResponseDto> {
    this.logger.log(
      `Creating saved word "${data.originalWord}" for user ${userId}`
    );

    // Generate pinyin if Chinese characters detected
    let pinyin: string | null = null;
    if (this.pinyinService.containsChinese(data.originalWord)) {
      pinyin = this.pinyinService.toPinyin(data.originalWord);
    }

    const savedWord = await this.savedWordRepository.create({
      userId,
      originalWord: data.originalWord,
      translation: data.translation,
      pinyin: pinyin ?? undefined,
      agentId: data.agentId,
      sessionId: data.sessionId,
      sentence: data.sentence,
      messageId: data.messageId,
    });

    return this.mapToResponseDto(savedWord);
  }

  async getSavedWords(userId: string): Promise<SavedWordResponseDto[]> {
    this.logger.debug(`Getting all saved words for user ${userId}`);
    const savedWords = await this.savedWordRepository.findAllByUserId(userId);
    return savedWords.map((word) => this.mapToResponseDto(word));
  }

  async getSavedWordsByLanguage(
    userId: string,
    language?: string
  ): Promise<SavedWordResponseDto[]> {
    this.logger.debug(
      `Getting saved words for user ${userId}, language: ${language || 'all'}`
    );
    const savedWords = await this.savedWordRepository.findAllByLanguage(
      userId,
      language
    );
    return savedWords.map((word) => this.mapToResponseDto(word));
  }

  async getSavedWord(
    id: number,
    userId: string
  ): Promise<SavedWordResponseDto> {
    this.logger.debug(`Getting saved word ${id} for user ${userId}`);
    const savedWord = await this.savedWordRepository.findById(id, userId);

    if (!savedWord) {
      throw new NotFoundException(`Saved word with ID ${id} not found`);
    }

    return this.mapToResponseDto(savedWord);
  }

  async findMatchingWords(
    userId: string,
    words: string[]
  ): Promise<SavedWordMatchDto[]> {
    this.logger.debug(
      `Finding matching saved words for ${words.length} words for user ${userId}`
    );

    const savedWords = await this.savedWordRepository.findMatchingWords(
      userId,
      words
    );

    // Create a map for case-insensitive matching
    const wordMap = new Map<string, SavedWordMatchDto>();

    for (const savedWord of savedWords) {
      const lowerKey = savedWord.originalWord.toLowerCase();
      // Only add if not already in map (first match wins)
      if (!wordMap.has(lowerKey)) {
        wordMap.set(lowerKey, {
          originalWord: savedWord.originalWord,
          savedWordId: savedWord.id,
          translation: savedWord.translation,
          pinyin: savedWord.pinyin,
        });
      }
    }

    return Array.from(wordMap.values());
  }

  async updateSavedWord(
    id: number,
    userId: string,
    data: UpdateSavedWordDto
  ): Promise<SavedWordResponseDto> {
    this.logger.log(`Updating saved word ${id} for user ${userId}`);

    const existingWord = await this.savedWordRepository.findById(id, userId);
    if (!existingWord) {
      throw new NotFoundException(`Saved word with ID ${id} not found`);
    }

    // If translation is being updated and word contains Chinese, regenerate pinyin
    let pinyin = data.pinyin;
    if (
      data.translation &&
      this.pinyinService.containsChinese(existingWord.originalWord)
    ) {
      // Pinyin is based on original word, not translation, so keep existing or regenerate
      if (!pinyin) {
        const generatedPinyin = this.pinyinService.toPinyin(
          existingWord.originalWord
        );
        pinyin = generatedPinyin ?? undefined;
      }
    }

    const updatedWord = await this.savedWordRepository.update(id, userId, {
      translation: data.translation,
      pinyin: pinyin ?? undefined,
    });

    return this.mapToResponseDto(updatedWord);
  }

  async deleteSavedWord(id: number, userId: string): Promise<void> {
    this.logger.log(`Deleting saved word ${id} for user ${userId}`);

    const existingWord = await this.savedWordRepository.findById(id, userId);
    if (!existingWord) {
      throw new NotFoundException(`Saved word with ID ${id} not found`);
    }

    await this.savedWordRepository.delete(id, userId);
  }

  async addSentence(
    savedWordId: number,
    userId: string,
    sentence: string,
    messageId?: number
  ): Promise<SavedWordSentenceResponseDto> {
    this.logger.log(
      `Adding sentence to saved word ${savedWordId} for user ${userId}`
    );

    // Verify word exists and belongs to user
    const savedWord = await this.savedWordRepository.findById(
      savedWordId,
      userId
    );
    if (!savedWord) {
      throw new NotFoundException(
        `Saved word with ID ${savedWordId} not found`
      );
    }

    const sentenceRecord = await this.savedWordRepository.addSentence(
      savedWordId,
      sentence,
      messageId
    );

    return {
      id: sentenceRecord.id,
      sentence: sentenceRecord.sentence,
      messageId: sentenceRecord.messageId,
      createdAt: sentenceRecord.createdAt,
    };
  }

  async removeSentence(
    sentenceId: number,
    savedWordId: number,
    userId: string
  ): Promise<void> {
    this.logger.log(
      `Removing sentence ${sentenceId} from saved word ${savedWordId} for user ${userId}`
    );

    // Verify word exists and belongs to user
    const savedWord = await this.savedWordRepository.findById(
      savedWordId,
      userId
    );
    if (!savedWord) {
      throw new NotFoundException(
        `Saved word with ID ${savedWordId} not found`
      );
    }

    await this.savedWordRepository.removeSentence(sentenceId, savedWordId);
  }

  private mapToResponseDto(
    word: SavedWord & {
      agent?: { name: string } | null;
      session?: { sessionName: string | null } | null;
      sentences?: Array<{
        id: number;
        sentence: string;
        messageId: number | null;
        createdAt: Date;
      }>;
    }
  ): SavedWordResponseDto {
    return {
      id: word.id,
      originalWord: word.originalWord,
      translation: word.translation,
      pinyin: word.pinyin,
      agentId: word.agentId,
      sessionId: word.sessionId,
      agentName: word.agent?.name || null,
      sessionName: word.session?.sessionName || null,
      sentences: (word.sentences || []).map(
        (s: {
          id: number;
          sentence: string;
          messageId: number | null;
          createdAt: Date;
        }) => ({
          id: s.id,
          sentence: s.sentence,
          messageId: s.messageId,
          createdAt: s.createdAt,
        })
      ),
      createdAt: word.createdAt,
      updatedAt: word.updatedAt,
    };
  }
}
