import { Injectable, Logger } from '@nestjs/common';
import { WordTranslationService } from '../word-translation.service';
import { MessageTranslationRepository } from '../message-translation.repository';
import {
  TranslationStrategy,
  TranslationContext,
  WordTranslation,
} from '../translation-strategy.interface';

/**
 * Strategy for translating user messages without conversation context
 * Uses existing word translation service methods
 */
@Injectable()
export class OnDemandTranslationStrategy implements TranslationStrategy {
  private readonly logger = new Logger(OnDemandTranslationStrategy.name);

  constructor(
    private readonly wordTranslationService: WordTranslationService,
    private readonly translationRepository: MessageTranslationRepository
  ) {}

  async translateMessageWithWords(
    messageId: number,
    messageContent: string,
    apiKey: string,
    _context?: TranslationContext
  ): Promise<{
    translation: string;
    wordTranslations: WordTranslation[];
  }> {
    this.logger.debug(
      `Translating message ${messageId} without conversation context (on-demand)`
    );

    // Use existing translateWordsInMessage which handles pre-parsed words
    // This is the current implementation for user messages
    await this.wordTranslationService.translateWordsInMessage(
      messageId,
      messageContent,
      apiKey
    );

    // Get the created translations
    const wordTranslations =
      await this.wordTranslationService.getWordTranslationsForMessage(
        messageId
      );

    // Get full translation
    const translation = await this.translationRepository.findByMessageId(
      messageId
    );

    if (!translation) {
      // Derive from word translations if full translation not available
      const derivedTranslation = wordTranslations
        .map((wt) => wt.translation)
        .filter((t) => t && t.trim() !== '')
        .join(' ');

      if (!derivedTranslation) {
        throw new Error('Translation failed: No translation available');
      }

      return {
        translation: derivedTranslation,
        wordTranslations,
      };
    }

    return {
      translation: translation.translation,
      wordTranslations,
    };
  }
}
