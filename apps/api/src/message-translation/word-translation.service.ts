import { Injectable } from '@nestjs/common';
import { WordTranslation } from './message-word-translation.repository';
import { WordParsingService } from './services/word-parsing.service';
import { WordTranslationOpenAIService } from './services/word-translation-openai.service';
import { WordTranslationStorageService } from './services/word-translation-storage.service';

/**
 * Orchestration service for word translation operations
 * Delegates to specialized services for parsing, translation, and storage
 */
@Injectable()
export class WordTranslationService {
  constructor(
    private readonly wordParsingService: WordParsingService,
    private readonly wordTranslationOpenAIService: WordTranslationOpenAIService,
    private readonly wordTranslationStorageService: WordTranslationStorageService
  ) {}

  /**
   * Save pre-parsed words directly (from OpenAI response or other source)
   */
  async saveParsedWords(
    messageId: number,
    words: Array<{ originalWord: string }>,
    messageContent: string
  ): Promise<void> {
    // Check if words already exist
    const exists =
      await this.wordTranslationStorageService.existsForMessage(messageId);
    if (exists) {
      return; // Already parsed
    }

    // Split message into sentences for context
    const sentences =
      this.wordParsingService.splitIntoSentences(messageContent);

    // Create a map of word -> sentence for populating sentenceContext
    const wordToSentenceMap = new Map<string, string>();
    words.forEach((w) => {
      const sentence = sentences.find((s) => s.includes(w.originalWord));
      if (sentence) {
        wordToSentenceMap.set(w.originalWord, sentence.trim());
      }
    });

    // Save to database with empty translations (will be filled when translation is requested)
    await this.wordTranslationStorageService.saveParsedWords(
      messageId,
      words,
      messageContent,
      sentences,
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
    messageContent: string
  ): Promise<void> {
    // Split message into sentences for context
    const sentences =
      this.wordParsingService.splitIntoSentences(messageContent);

    // Create a map of word -> sentence for populating sentenceContext
    const wordToSentenceMap = new Map<string, string>();
    words.forEach((w) => {
      const sentence = sentences.find((s) => s.includes(w.originalWord));
      if (sentence) {
        wordToSentenceMap.set(w.originalWord, sentence.trim());
      }
    });

    // Save extracted translations
    await this.wordTranslationStorageService.saveExtractedTranslations(
      messageId,
      words,
      fullTranslation,
      wordToSentenceMap
    );
  }

  /**
   * Parse words from message content (without translation)
   * This is called immediately after receiving a response to enable highlighting
   * Uses OpenAI to parse words, especially for languages without spaces (e.g., Chinese)
   */
  async parseWordsInMessage(
    messageId: number,
    messageContent: string,
    apiKey: string
  ): Promise<void> {
    // Check if words already exist
    const exists =
      await this.wordTranslationStorageService.existsForMessage(messageId);
    if (exists) {
      return; // Already parsed
    }

    // Split message into sentences for context
    const sentences =
      this.wordParsingService.splitIntoSentences(messageContent);

    // Use OpenAI to parse words (without translation)
    const wordTranslations = await this.wordParsingService.parseWordsWithOpenAI(
      messageContent,
      sentences,
      apiKey
    );

    // Create a map of word -> sentence for populating sentenceContext
    const wordToSentenceMap = this.wordParsingService.createWordToSentenceMap(
      messageContent,
      sentences,
      wordTranslations
    );

    // Save to database with empty translations (will be filled when translation is requested)
    await this.wordTranslationStorageService.saveParsedWords(
      messageId,
      wordTranslations.map((wt) => ({ originalWord: wt.originalWord })),
      messageContent,
      sentences,
      wordToSentenceMap
    );
  }

  /**
   * Analyze message and create word-level translations
   * Uses pre-parsed words if available, otherwise parses and translates
   */
  async translateWordsInMessage(
    messageId: number,
    messageContent: string,
    apiKey: string,
    userId?: string,
    agentId?: number | null
  ): Promise<void> {
    // Check if translations already exist with actual translations
    const existingWords =
      await this.wordTranslationStorageService.getWordTranslationsForMessage(
        messageId
      );
    const hasTranslations =
      existingWords?.some((w) => w.translation.trim() !== '') ?? false;

    if (hasTranslations) {
      return; // Already translated
    }

    // Split message into sentences for context
    const sentences =
      this.wordParsingService.splitIntoSentences(messageContent);

    // If words exist but without translations, use them
    if (existingWords && existingWords.length > 0) {
      // Translate only the pre-parsed words
      const { wordTranslations, fullTranslation } =
        await this.wordTranslationOpenAIService.translatePreParsedWordsWithOpenAI(
          existingWords.map((w) => w.originalWord),
          messageContent,
          sentences,
          apiKey,
          userId,
          agentId
        );

      // Create word-to-sentence map
      const wordToSentenceMap = this.wordParsingService.createWordToSentenceMap(
        messageContent,
        sentences,
        wordTranslations
      );

      // Update existing words with translations and save full translation
      await this.wordTranslationStorageService.updateWordsWithTranslations(
        messageId,
        wordTranslations,
        wordToSentenceMap,
        fullTranslation
      );

      // If no full translation provided, derive from words
      if (!fullTranslation) {
        await this.wordTranslationStorageService.createFullTranslationFromWords(
          messageId,
          wordTranslations
        );
      }
      return;
    }

    // No pre-parsed words exist, do full parse + translate
    const { wordTranslations, fullTranslation } =
      await this.wordTranslationOpenAIService.translateWordsWithOpenAI(
        messageContent,
        sentences,
        apiKey,
        userId,
        agentId
      );

    const wordToSentenceMap = this.wordParsingService.createWordToSentenceMap(
      messageContent,
      sentences,
      wordTranslations
    );

    // Update words with translations and save full translation
    await this.wordTranslationStorageService.updateWordsWithTranslations(
      messageId,
      wordTranslations,
      wordToSentenceMap,
      fullTranslation
    );

    // If no full translation provided, derive from words
    if (!fullTranslation) {
      await this.wordTranslationStorageService.createFullTranslationFromWords(
        messageId,
        wordTranslations
      );
    }
  }

  /**
   * Get word translations for a message
   * Returns words even if they don't have translations yet (for highlighting)
   */
  async getWordTranslationsForMessage(
    messageId: number
  ): Promise<WordTranslation[]> {
    return this.wordTranslationStorageService.getWordTranslationsForMessage(
      messageId
    );
  }

  /**
   * Get word translations for multiple messages
   */
  async getWordTranslationsForMessages(
    messageIds: number[]
  ): Promise<Map<number, WordTranslation[]>> {
    return this.wordTranslationStorageService.getWordTranslationsForMessages(
      messageIds
    );
  }
}
