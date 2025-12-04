import { Injectable } from '@nestjs/common';
import {
  MessageWordTranslationRepository,
  WordTranslation,
} from '../message-word-translation.repository';
import { MessageTranslationRepository } from '../message-translation.repository';

/**
 * Service responsible for storing and retrieving word translations
 * Handles database operations for word translations and full message translations
 */
@Injectable()
export class WordTranslationStorageService {
  constructor(
    private readonly wordTranslationRepository: MessageWordTranslationRepository,
    private readonly translationRepository: MessageTranslationRepository
  ) {}

  /**
   * Check if word translations exist for a message
   */
  async existsForMessage(messageId: number): Promise<boolean> {
    return this.wordTranslationRepository.existsForMessage(messageId);
  }

  /**
   * Save pre-parsed words directly (from OpenAI response or other source)
   */
  async saveParsedWords(
    messageId: number,
    words: Array<{ originalWord: string }>,
    _messageContent: string,
    _sentences: string[],
    wordToSentenceMap: Map<string, string>
  ): Promise<void> {
    // Save to database with empty translations (will be filled when translation is requested)
    await this.wordTranslationRepository.createMany(
      messageId,
      words.map((w) => ({
        originalWord: w.originalWord,
        translation: '', // Empty translation, will be filled later
      })),
      wordToSentenceMap
    );
  }

  /**
   * Save extracted translations from OpenAI response JSON
   * Includes both word translations and full translation
   */
  async saveExtractedTranslations(
    messageId: number,
    words: Array<{ originalWord: string; translation: string }>,
    fullTranslation: string,
    wordToSentenceMap: Map<string, string>
  ): Promise<void> {
    // Delete existing translations if any
    await this.wordTranslationRepository.deleteByMessageId(messageId);

    // Save word translations with translations
    await this.wordTranslationRepository.createMany(
      messageId,
      words.map((w) => ({
        originalWord: w.originalWord,
        translation: w.translation,
        sentenceContext: wordToSentenceMap.get(w.originalWord),
      })),
      wordToSentenceMap
    );

    // Save full translation
    const existing =
      await this.translationRepository.findByMessageId(messageId);
    if (!existing) {
      await this.translationRepository.create(messageId, fullTranslation);
    } else {
      // Update existing translation
      await this.translationRepository.update(messageId, fullTranslation);
    }
  }

  /**
   * Update existing words with translations
   */
  async updateWordsWithTranslations(
    messageId: number,
    wordTranslations: WordTranslation[],
    wordToSentenceMap: Map<string, string>,
    fullTranslation?: string | null
  ): Promise<void> {
    // Delete old entries and create new ones with translations
    await this.wordTranslationRepository.deleteByMessageId(messageId);
    await this.wordTranslationRepository.createMany(
      messageId,
      wordTranslations,
      wordToSentenceMap
    );

    // Save full translation if provided
    if (fullTranslation) {
      const existing =
        await this.translationRepository.findByMessageId(messageId);
      if (!existing) {
        await this.translationRepository.create(messageId, fullTranslation);
      } else {
        await this.translationRepository.update(messageId, fullTranslation);
      }
    }
  }

  /**
   * Create full message translation from word translations
   */
  async createFullTranslationFromWords(
    messageId: number,
    wordTranslations: WordTranslation[]
  ): Promise<void> {
    // Check if translation already exists
    const existing =
      await this.translationRepository.findByMessageId(messageId);
    if (existing) {
      return; // Already has translation
    }

    // Derive full translation by joining word translations with spaces
    // This preserves the order and creates a readable full translation
    const fullTranslation = wordTranslations
      .map((wt) => wt.translation)
      .join(' ');

    // Save the derived full translation
    await this.translationRepository.create(messageId, fullTranslation);
  }

  /**
   * Get word translations for a message
   * Returns words even if they don't have translations yet (for highlighting)
   */
  async getWordTranslationsForMessage(
    messageId: number
  ): Promise<WordTranslation[]> {
    const translations =
      await this.wordTranslationRepository.findByMessageId(messageId);
    return translations.map((t) => ({
      originalWord: t.originalWord,
      translation: t.translation || '', // Return empty string if no translation yet
      sentenceContext: t.sentenceContext ?? undefined,
    }));
  }

  /**
   * Get word translations for multiple messages
   */
  async getWordTranslationsForMessages(
    messageIds: number[]
  ): Promise<Map<number, WordTranslation[]>> {
    const translations =
      await this.wordTranslationRepository.findByMessageIds(messageIds);

    const translationMap = new Map<number, WordTranslation[]>();

    translations.forEach((t) => {
      if (!translationMap.has(t.messageId)) {
        translationMap.set(t.messageId, []);
      }
      translationMap.get(t.messageId)!.push({
        originalWord: t.originalWord,
        translation: t.translation,
        sentenceContext: t.sentenceContext ?? undefined,
      });
    });

    return translationMap;
  }
}
