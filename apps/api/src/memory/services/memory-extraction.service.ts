import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../../openai/openai.service';
import {
  MEMORY_CONFIG,
  OPENAI_MODELS,
} from '../../common/constants/api.constants.js';
import { OPENAI_PROMPTS } from '../../common/constants/openai-prompts.constants.js';
import { NUMERIC_CONSTANTS } from '../../common/constants/numeric.constants.js';
import { AiRequestLogService } from '../../ai-request-log/ai-request-log.service';
import { LogType } from '@prisma/client';

/**
 * Service responsible for extracting key insights from conversation messages
 */
@Injectable()
export class MemoryExtractionService {
  private readonly logger = new Logger(MemoryExtractionService.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly aiRequestLogService: AiRequestLogService
  ) {}

  /**
   * Extract key insights from conversation messages using OpenAI
   */
  async extractKeyInsights(
    messages: Array<{ role: string; content: string }>,
    apiKey: string,
    agentId?: number | null,
    userId?: string
  ): Promise<string[]> {
    if (messages.length === 0) {
      this.logger.debug('No messages provided for extraction');
      return [];
    }

    this.logger.debug(`Extracting insights from ${messages.length} messages`);

    // Get the last N messages for context
    const recentMessages = messages.slice(
      -NUMERIC_CONSTANTS.MEMORY_EXTRACTION_MESSAGES
    );
    const conversationText = recentMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    const prompt = OPENAI_PROMPTS.MEMORY.EXTRACTION.USER(
      conversationText,
      MEMORY_CONFIG.MAX_KEY_INSIGHTS_PER_UPDATE,
      MEMORY_CONFIG.MAX_MEMORY_LENGTH
    );

    try {
      const openai = this.openaiService.getClient(apiKey);
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODELS.MEMORY,
        messages: [
          {
            role: 'system',
            content: OPENAI_PROMPTS.MEMORY.EXTRACTION.SYSTEM,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: NUMERIC_CONSTANTS.TRANSLATION_TEMPERATURE,
        max_tokens: NUMERIC_CONSTANTS.MEMORY_EXTRACTION_MAX_TOKENS,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        this.logger.warn('No response from OpenAI for memory extraction');
        return [];
      }

      // Log the request/response
      await this.aiRequestLogService.logRequest(
        userId,
        {
          model: OPENAI_MODELS.MEMORY,
          messages: [
            {
              role: 'system',
              content: OPENAI_PROMPTS.MEMORY.EXTRACTION.SYSTEM,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: NUMERIC_CONSTANTS.TRANSLATION_TEMPERATURE,
          max_tokens: NUMERIC_CONSTANTS.MEMORY_EXTRACTION_MAX_TOKENS,
        },
        completion,
        {
          agentId,
          logType: LogType.MEMORY,
        }
      );

      // Parse insights from response
      const insights = response
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .filter((line) => !line.match(/^\d+[.)]/)) // Remove numbering
        .map((line) => line.replace(/^[-•*]\s*/, '')) // Remove bullets
        .filter((line) => line.length <= MEMORY_CONFIG.MAX_MEMORY_LENGTH)
        .slice(0, MEMORY_CONFIG.MAX_KEY_INSIGHTS_PER_UPDATE);

      if (insights.length === 0) {
        this.logger.warn(
          `No insights extracted from ${messages.length} messages. Response was: ${response.substring(0, 200)}...`
        );
      } else {
        this.logger.log(
          `Extracted ${insights.length} insights from ${messages.length} messages`
        );
      }
      return insights;
    } catch (error) {
      this.logger.error('Error extracting key insights:', error);
      return [];
    }
  }
}
