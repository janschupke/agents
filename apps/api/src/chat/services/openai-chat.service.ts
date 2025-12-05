import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { OpenAIService } from '../../openai/openai.service';
import { MessageRole } from '../../common/enums/message-role.enum';
import { OPENAI_MODELS } from '../../common/constants/api.constants';
import { NUMERIC_CONSTANTS } from '../../common/constants/numeric.constants';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constants';
import { AiRequestLogService } from '../../ai-request-log/ai-request-log.service';
import { OpenAIErrorHandler } from '../../common/utils/openai-error-handler.util';
import { convertMessageRoleToOpenAI } from '../../common/utils/message-role.util';
import { PerformanceLogger } from '../../common/utils/performance-logger.util';
import type OpenAI from 'openai';

interface MessageForOpenAI {
  role: MessageRole;
  content: string;
}

interface AgentConfig {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface OpenAIRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  max_tokens?: number;
}

@Injectable()
export class OpenAIChatService {
  private readonly logger = new Logger(OpenAIChatService.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly aiRequestLogService: AiRequestLogService
  ) {}

  /**
   * Create OpenAI chat completion request
   */
  createOpenAIRequest(
    messages: MessageForOpenAI[],
    agentConfig: AgentConfig
  ): OpenAIRequest {
    return {
      model: String(agentConfig.model || OPENAI_MODELS.DEFAULT),
      messages: messages.map((m) => ({
        role: convertMessageRoleToOpenAI(m.role),
        content: m.content,
      })),
      temperature: Number(
        agentConfig.temperature || NUMERIC_CONSTANTS.DEFAULT_TEMPERATURE
      ),
      max_tokens: agentConfig.max_tokens
        ? Number(agentConfig.max_tokens)
        : undefined,
    };
  }

  /**
   * Call OpenAI API and return completion
   */
  async createChatCompletion(
    apiKey: string,
    request: OpenAIRequest,
    userId?: string,
    agentId?: number | null
  ): Promise<{
    response: string;
    completion: OpenAI.Chat.Completions.ChatCompletion;
  }> {
    this.logger.debug(
      `Calling OpenAI API with model: ${request.model}, messages: ${request.messages.length}`
    );

    try {
      const openai = this.openaiService.getClient(apiKey);
      const completion = await PerformanceLogger.measureAsync(
        this.logger,
        'OpenAI API call',
        async () =>
          openai.chat.completions.create({
            model: request.model,
            messages: request.messages as Array<{
              role: 'system' | 'user' | 'assistant';
              content: string;
            }>,
            temperature: request.temperature,
            max_tokens: request.max_tokens,
          }),
        {
          model: request.model,
          messagesCount: request.messages.length,
        }
      );

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        this.logger.error('No response from OpenAI API');
        throw new HttpException(
          ERROR_MESSAGES.NO_RESPONSE_FROM_OPENAI,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      this.logger.debug(
        `OpenAI API call successful. Response length: ${response.length}`
      );

      // Log the request/response
      await this.aiRequestLogService.logRequest(
        userId,
        {
          model: request.model,
          messages: request.messages as Array<{
            role: 'system' | 'user' | 'assistant';
            content: string;
          }>,
          temperature: request.temperature,
          max_tokens: request.max_tokens,
        },
        completion,
        {
          agentId,
          logType: 'MESSAGE' as const,
        }
      );

      return { response, completion };
    } catch (error) {
      // Use centralized error handler
      throw OpenAIErrorHandler.handleError(error, 'createChatCompletion');
    }
  }
}
