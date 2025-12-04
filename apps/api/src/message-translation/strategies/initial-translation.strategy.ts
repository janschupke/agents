import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { OpenAIService } from '../../openai/openai.service';
import { MessageWordTranslationRepository } from '../message-word-translation.repository';
import { MessageTranslationRepository } from '../message-translation.repository';
import {
  TranslationStrategy,
  TranslationContext,
  WordTranslation,
} from '../translation-strategy.interface';
import { OPENAI_PROMPTS } from '../../common/constants/openai-prompts.constants.js';
import { NUMERIC_CONSTANTS } from '../../common/constants/numeric.constants.js';
import { OPENAI_MODELS } from '../../common/constants/api.constants.js';
import { AiRequestLogService } from '../../ai-request-log/ai-request-log.service';

/**
 * Strategy for translating assistant messages with conversation context
 * Used for on-demand translation requests (e.g., translating old messages)
 * or fallback when initial response doesn't include translations
 */
@Injectable()
export class InitialTranslationStrategy implements TranslationStrategy {
  private readonly logger = new Logger(InitialTranslationStrategy.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly wordTranslationRepository: MessageWordTranslationRepository,
    private readonly translationRepository: MessageTranslationRepository,
    private readonly aiRequestLogService: AiRequestLogService
  ) {}

  async translateMessageWithWords(
    messageId: number,
    messageContent: string,
    apiKey: string,
    context?: TranslationContext
  ): Promise<{
    translation: string;
    wordTranslations: WordTranslation[];
  }> {
    this.logger.debug(
      `Translating message ${messageId} with conversation context`
    );

    // Use conversation context for better translation quality
    const conversationHistory = context?.conversationHistory || [];

    // Build prompt with conversation context
    const prompt = this.buildTranslationPrompt(
      messageContent,
      conversationHistory
    );

    // Extract userId from context if available
    const userId = (context as any)?.userId;
    // Call to OpenAI for translation with context
    const result = await this.translateWithContext(prompt, apiKey, userId);

    // Save translations
    await this.saveTranslations(messageId, result, messageContent);

    return result;
  }

  private buildTranslationPrompt(
    messageContent: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): string {
    if (conversationHistory.length === 0) {
      // No context, use standard prompt
      return OPENAI_PROMPTS.WORD_TRANSLATION.USER(messageContent);
    }

    // Build context string
    const contextString = conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    return `You are a professional translator. Analyze the following text and translate each word/token to English, considering both the sentence context and the conversation history.

Previous conversation:
${contextString}

Text to translate:
${messageContent}

For each word or token (handle languages without spaces like Chinese, Japanese, etc.), provide:
1. The original word/token as it appears in the text
2. Its English translation considering the sentence context and conversation history

Also provide the full sentence translation in natural, fluent English.

Return a JSON object with:
- "fullTranslation": string (the complete message translated into natural, fluent English)
- "words": array where each element has:
  - "originalWord": string (the word/token as it appears in the text)
  - "translation": string (English translation of the word in context)

Return ONLY the JSON object, no additional text.`;
  }

  private async translateWithContext(
    prompt: string,
    apiKey: string,
    userId?: string
  ): Promise<{
    translation: string;
    wordTranslations: WordTranslation[];
  }> {
    const openai = this.openaiService.getClient(apiKey);

    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODELS.TRANSLATION,
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

      let parsed: {
        words?: WordTranslation[];
        fullTranslation?: string;
      };
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

      if (!fullTranslation) {
        throw new HttpException(
          'Word translation failed: Missing fullTranslation',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Log the request/response
      await this.aiRequestLogService.logRequest(
        userId,
        {
          model: OPENAI_MODELS.TRANSLATION,
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
        },
        completion
      );

      return {
        wordTranslations,
        translation: fullTranslation,
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

  private async saveTranslations(
    messageId: number,
    result: {
      translation: string;
      wordTranslations: WordTranslation[];
    },
    messageContent: string
  ): Promise<void> {
    // Save word translations
    const sentences = this.splitIntoSentences(messageContent);
    const wordToSentenceMap = new Map<string, string>();
    result.wordTranslations.forEach((wt) => {
      const sentence = sentences.find((s) => s.includes(wt.originalWord));
      if (sentence) {
        wordToSentenceMap.set(wt.originalWord, sentence.trim());
      }
    });

    // Delete existing translations and save new ones
    await this.wordTranslationRepository.deleteByMessageId(messageId);
    await this.wordTranslationRepository.createMany(
      messageId,
      result.wordTranslations.map((wt) => ({
        ...wt,
        sentenceContext: wordToSentenceMap.get(wt.originalWord),
      })),
      wordToSentenceMap
    );

    // Save full translation
    await this.translationRepository.create(messageId, result.translation);
  }

  private splitIntoSentences(text: string): string[] {
    return text
      .split(/([.!?。！？]+[\s\n]*)/)
      .filter((s) => s.trim().length > 0);
  }
}
