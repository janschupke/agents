import { Injectable, Logger } from '@nestjs/common';
import { AiRequestLogRepository } from './ai-request-log.repository';
import { OPENAI_MODEL_PRICING } from '../common/constants/api.constants';
import { AiRequestLogOrderBy, OrderDirection } from './constants/ai-request-log.constants';
import { Prisma } from '@prisma/client';
import OpenAI from 'openai';

@Injectable()
export class AiRequestLogService {
  private readonly logger = new Logger(AiRequestLogService.name);

  constructor(
    private readonly aiRequestLogRepository: AiRequestLogRepository
  ) {}

  /**
   * Calculate estimated price based on model and token usage
   */
  calculatePrice(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    const pricing = OPENAI_MODEL_PRICING[model as keyof typeof OPENAI_MODEL_PRICING];
    
    if (!pricing) {
      this.logger.warn(`No pricing found for model: ${model}, using default`);
      // Default to gpt-4o-mini pricing if model not found
      const defaultPricing = OPENAI_MODEL_PRICING['gpt-4o-mini'];
      return (
        (promptTokens / 1_000_000) * defaultPricing.input +
        (completionTokens / 1_000_000) * defaultPricing.output
      );
    }

    return (
      (promptTokens / 1_000_000) * pricing.input +
      (completionTokens / 1_000_000) * pricing.output
    );
  }

  /**
   * Log OpenAI API request/response
   */
  async logRequest(
    userId: string | undefined,
    request: OpenAI.Chat.Completions.ChatCompletionCreateParams,
    completion: OpenAI.Chat.Completions.ChatCompletion
  ): Promise<void> {
    try {
      const promptTokens = completion.usage?.prompt_tokens || 0;
      const completionTokens = completion.usage?.completion_tokens || 0;
      const totalTokens = completion.usage?.total_tokens || 0;
      const model = request.model;

      const estimatedPrice = this.calculatePrice(
        model,
        promptTokens,
        completionTokens
      );

      await this.aiRequestLogRepository.create({
        userId: userId ?? null,
        requestJson: request as unknown as Prisma.InputJsonValue,
        responseJson: completion as unknown as Prisma.InputJsonValue,
        model,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedPrice,
      });

      this.logger.debug(
        `Logged AI request: model=${model}, tokens=${totalTokens}, price=$${estimatedPrice.toFixed(6)}`
      );
    } catch (error) {
      // Don't throw - logging failures shouldn't break the main flow
      this.logger.error('Failed to log AI request:', error);
    }
  }

  /**
   * Get all logs with pagination
   */
  async getAllLogs(options?: {
    userId?: string;
    model?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
    orderBy?: AiRequestLogOrderBy;
    orderDirection?: OrderDirection;
  }) {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      this.aiRequestLogRepository.findAll({
        ...options,
        skip,
        take: pageSize,
      }),
      this.aiRequestLogRepository.count(options),
    ]);

    return {
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
