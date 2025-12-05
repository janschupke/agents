import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { OpenAIService } from '../../openai/openai.service';
import { OPENAI_MODELS } from '../../common/constants/api.constants.js';
import { OPENAI_PROMPTS } from '../../common/constants/openai-prompts.constants.js';
import { NUMERIC_CONSTANTS } from '../../common/constants/numeric.constants.js';
import { AiRequestLogService } from '../../ai-request-log/ai-request-log.service';
import { WordTranslation } from '../message-word-translation.repository';
import { MessageRole, messageRoleToOpenAI } from '@openai/shared-types';

/**
 * Service responsible for translating words using OpenAI
 * Handles both pre-parsed words and full message translation
 */
@Injectable()
export class WordTranslationOpenAIService {
  constructor(
    private readonly openaiService: OpenAIService,
    private readonly aiRequestLogService: AiRequestLogService
  ) {}

  /**
   * Translate pre-parsed words using OpenAI
   * Only requests translation, not word splitting
   */
  async translatePreParsedWordsWithOpenAI(
    words: string[],
    messageContent: string,
    _sentences: string[],
    apiKey: string,
    userId?: string,
    agentId?: number | null
  ): Promise<{
    wordTranslations: WordTranslation[];
    fullTranslation: string | null;
  }> {
    const openai = this.openaiService.getClient(apiKey);

    const prompt = `You are a professional translator. Translate the following pre-parsed words to English, considering the sentence context.

Text:
${messageContent}

Words to translate:
${words.map((w, i) => `${i + 1}. ${w}`).join('\n')}

For each word, provide:
1. The original word/token as provided
2. Its English translation considering the sentence context

Also provide the full sentence translation in natural, fluent English.

Return a JSON object with:
- "fullTranslation": string (the complete message translated into natural, fluent English)
- "words": array where each element has:
  - "originalWord": string (the word/token as provided)
  - "translation": string (English translation of the word in context)

Return ONLY the JSON object, no additional text.`;

    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODELS.TRANSLATION,
        messages: [
          {
            role: messageRoleToOpenAI(MessageRole.SYSTEM),
            content: OPENAI_PROMPTS.WORD_TRANSLATION.SYSTEM,
          },
          {
            role: messageRoleToOpenAI(MessageRole.USER),
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
        completion,
        {
          agentId,
          logType: 'TRANSLATION' as const,
        }
      );

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
   * Translate words using OpenAI - let OpenAI handle word/token splitting
   * Returns both word translations and full sentence translation
   */
  async translateWordsWithOpenAI(
    messageContent: string,
    _sentences: string[],
    apiKey: string,
    userId?: string,
    agentId?: number | null
  ): Promise<{
    wordTranslations: WordTranslation[];
    fullTranslation: string | null;
  }> {
    const openai = this.openaiService.getClient(apiKey);

    const prompt = OPENAI_PROMPTS.WORD_TRANSLATION.USER(messageContent);

    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODELS.TRANSLATION,
        messages: [
          {
            role: messageRoleToOpenAI(MessageRole.SYSTEM),
            content: OPENAI_PROMPTS.WORD_TRANSLATION.SYSTEM,
          },
          {
            role: messageRoleToOpenAI(MessageRole.USER),
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
        completion,
        {
          agentId,
          logType: 'TRANSLATION' as const,
        }
      );

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
}
