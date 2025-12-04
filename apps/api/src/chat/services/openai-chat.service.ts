import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { OpenAIService } from '../../openai/openai.service';
import { MessageRole } from '../../common/enums/message-role.enum';
import { OPENAI_MODELS } from '../../common/constants/api.constants';
import { NUMERIC_CONSTANTS } from '../../common/constants/numeric.constants';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constants';
import type OpenAI from 'openai';

export interface MessageForOpenAI {
  role: MessageRole;
  content: string;
}

export interface AgentConfig {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface OpenAIRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  max_tokens?: number;
}

@Injectable()
export class OpenAIChatService {
  private readonly logger = new Logger(OpenAIChatService.name);

  constructor(private readonly openaiService: OpenAIService) {}

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
        role: m.role.toLowerCase() as 'system' | 'user' | 'assistant',
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
    request: OpenAIRequest
  ): Promise<{
    response: string;
    completion: OpenAI.Chat.Completions.ChatCompletion;
  }> {
    this.logger.debug(
      `Calling OpenAI API with model: ${request.model}, messages: ${request.messages.length}`
    );

    try {
      const openai = this.openaiService.getClient(apiKey);
      const completion = await openai.chat.completions.create({
        model: request.model,
        messages: request.messages as Array<{
          role: 'system' | 'user' | 'assistant';
          content: string;
        }>,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
      });

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
      return { response, completion };
    } catch (error) {
      this.logger.error('OpenAI API call failed:', error);

      // Handle API key errors
      const errorObj = error as { message?: string; status?: number };
      if (errorObj.message?.includes('API key') || errorObj.status === 401) {
        throw new HttpException(
          'Invalid API key. Please check your API credentials.',
          HttpStatus.UNAUTHORIZED
        );
      }

      // Re-throw HttpException as-is
      if (error instanceof HttpException) {
        throw error;
      }

      // Wrap other errors
      throw new HttpException(
        errorObj.message || ERROR_MESSAGES.UNKNOWN_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
