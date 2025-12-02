import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { OpenAIService } from '../openai/openai.service';
import {
  MessageWordTranslationRepository,
  WordTranslation,
} from './message-word-translation.repository';
import { MessageTranslationRepository } from './message-translation.repository';
import { OPENAI_PROMPTS } from '../common/constants/openai-prompts.constants.js';
import { NUMERIC_CONSTANTS } from '../common/constants/numeric.constants.js';

@Injectable()
export class WordTranslationService {
  constructor(
    private readonly wordTranslationRepository: MessageWordTranslationRepository,
    private readonly openaiService: OpenAIService,
    private readonly translationRepository: MessageTranslationRepository
  ) {}

  /**
   * Analyze message and create word-level translations
   * OpenAI handles word/token splitting, especially for languages without spaces (e.g., Chinese)
   */
  async translateWordsInMessage(
    messageId: number,
    messageContent: string,
    apiKey: string
  ): Promise<void> {
    // Check if translations already exist
    const exists =
      await this.wordTranslationRepository.existsForMessage(messageId);
    if (exists) {
      return; // Already translated
    }

    // Split message into sentences for context (we'll use this to populate sentenceContext)
    const sentences = this.splitIntoSentences(messageContent);

    // Let OpenAI handle word/token splitting and translation
    const { wordTranslations, fullTranslation } =
      await this.translateWordsWithOpenAI(messageContent, sentences, apiKey);

    // Create a map of word -> sentence for populating sentenceContext
    const wordToSentenceMap = this.createWordToSentenceMap(
      messageContent,
      sentences,
      wordTranslations
    );

    // Save to database with sentence contexts populated
    await this.wordTranslationRepository.createMany(
      messageId,
      wordTranslations,
      wordToSentenceMap
    );

    // Save full message translation from OpenAI (not derived from words)
    if (fullTranslation) {
      // Check if translation already exists
      const existing =
        await this.translationRepository.findByMessageId(messageId);
      if (!existing) {
        await this.translationRepository.create(messageId, fullTranslation);
      }
    } else {
      // Fallback: derive from words if OpenAI didn't provide full translation
      await this.createFullTranslationFromWords(messageId, wordTranslations);
    }
  }

  /**
   * Create full message translation from word translations
   */
  private async createFullTranslationFromWords(
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
   * Split message into sentences for context
   */
  private splitIntoSentences(text: string): string[] {
    // Split by sentence-ending punctuation, but keep the punctuation
    // This handles various languages and punctuation marks
    return text
      .split(/([.!?。！？]+[\s\n]*)/)
      .filter((s) => s.trim().length > 0);
  }

  /**
   * Create a map of words to their containing sentences
   */
  private createWordToSentenceMap(
    _messageContent: string,
    sentences: string[],
    wordTranslations: WordTranslation[]
  ): Map<string, string> {
    const wordToSentence = new Map<string, string>();

    // For each word, find which sentence it belongs to
    wordTranslations.forEach((wt) => {
      if (!wordToSentence.has(wt.originalWord)) {
        // Find the sentence containing this word
        const containingSentence = sentences.find((sentence) =>
          sentence.includes(wt.originalWord)
        );
        if (containingSentence) {
          wordToSentence.set(wt.originalWord, containingSentence.trim());
        }
      }
    });

    return wordToSentence;
  }

  /**
   * Translate words using OpenAI - let OpenAI handle word/token splitting
   * Returns both word translations and full sentence translation
   */
  private async translateWordsWithOpenAI(
    messageContent: string,
    _sentences: string[],
    apiKey: string
  ): Promise<{
    wordTranslations: WordTranslation[];
    fullTranslation: string | null;
  }> {
    const openai = this.openaiService.getClient(apiKey);

    const prompt = OPENAI_PROMPTS.WORD_TRANSLATION.USER(messageContent);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: OPENAI_PROMPTS.WORD_TRANSLATION.SYSTEM,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: NUMERIC_CONSTANTS.TRANSLATION_TEMPERATURE,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content?.trim();
      if (!response) {
        throw new HttpException(
          'Word translation failed: No response',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Parse JSON response
      let parsed: { words?: WordTranslation[]; fullTranslation?: string };
      try {
        parsed = JSON.parse(response);
      } catch (e) {
        throw new HttpException(
          'Word translation failed: Invalid JSON',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const translations = parsed.words || [];
      const fullTranslation = parsed.fullTranslation;

      // Validate and map to our format
      interface WordTranslationItem {
        originalWord?: string;
        translation?: string;
      }
      const wordTranslations = (translations as WordTranslationItem[])
        .filter((wt) => wt.originalWord && wt.translation)
        .map((wt) => ({
          originalWord: wt.originalWord!,
          translation: wt.translation!,
        }));

      return {
        wordTranslations,
        fullTranslation: fullTranslation || null,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Word translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get word translations for a message
   */
  async getWordTranslationsForMessage(
    messageId: number
  ): Promise<WordTranslation[]> {
    const translations =
      await this.wordTranslationRepository.findByMessageId(messageId);
    return translations.map((t) => ({
      originalWord: t.originalWord,
      translation: t.translation,
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
