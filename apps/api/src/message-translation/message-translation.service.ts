import { Injectable, Logger } from '@nestjs/common';
import { MessageTranslationRepository } from './message-translation.repository';
import { MessageRepository } from '../message/message.repository';
import { SessionRepository } from '../session/session.repository';
import { OpenAIService } from '../openai/openai.service';
import { ApiCredentialsService } from '../api-credentials/api-credentials.service';
import { WordTranslationService } from './word-translation.service';
import { TranslationStrategyFactory } from './translation-strategy.factory';
import { TranslationContext } from './translation-strategy.interface';
import { MessageRole, messageRoleToOpenAI } from '@openai/shared-types';
import { OPENAI_PROMPTS } from '../common/constants/openai-prompts.constants.js';
import { NUMERIC_CONSTANTS } from '../common/constants/numeric.constants.js';
import { MAGIC_STRINGS } from '../common/constants/error-messages.constants.js';
import { OPENAI_MODELS } from '../common/constants/api.constants.js';
import { AiRequestLogService } from '../ai-request-log/ai-request-log.service';
import {
  MessageNotFoundException,
  SessionNotFoundException,
  ApiKeyRequiredException,
} from '../common/exceptions';

@Injectable()
export class MessageTranslationService {
  private readonly logger = new Logger(MessageTranslationService.name);

  constructor(
    private readonly translationRepository: MessageTranslationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly openaiService: OpenAIService,
    private readonly apiCredentialsService: ApiCredentialsService,
    private readonly wordTranslationService: WordTranslationService,
    private readonly translationStrategyFactory: TranslationStrategyFactory,
    private readonly aiRequestLogService: AiRequestLogService
  ) {}

  /**
   * Translate a message to English with conversation context
   */
  async translateMessage(
    messageId: number,
    userId: string
  ): Promise<{ translation: string }> {
    this.logger.log(`Translating message ${messageId} for user ${userId}`);

    // Check if translation already exists
    const existing =
      await this.translationRepository.findByMessageId(messageId);
    if (existing) {
      this.logger.debug(`Translation already exists for message ${messageId}`);
      return { translation: existing.translation };
    }

    // Get the message
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      this.logger.warn(`Message ${messageId} not found`);
      throw new MessageNotFoundException(messageId);
    }

    // Verify user has access to this message's session
    const session = await this.sessionRepository.findByIdAndUserId(
      message.sessionId,
      userId
    );
    if (!session) {
      this.logger.warn(
        `User ${userId} does not have access to session ${message.sessionId}`
      );
      throw new SessionNotFoundException(message.sessionId);
    }

    // Get conversation context (previous messages for context)
    const contextMessages = await this.getContextMessages(
      message.sessionId,
      messageId
    );

    // Get user's API key
    const apiKey = await this.apiCredentialsService.getApiKey(
      userId,
      MAGIC_STRINGS.OPENAI_PROVIDER
    );
    if (!apiKey) {
      this.logger.warn(`No API key found for user ${userId}`);
      throw new ApiKeyRequiredException();
    }

    // Call OpenAI to translate
    const translation = await this.translateWithOpenAI(
      message.content,
      contextMessages,
      apiKey,
      userId,
      session.agentId
    );

    // Save translation
    await this.translationRepository.create(messageId, translation);

    return { translation };
  }

  /**
   * Get previous messages for context (last 10 messages before the target)
   */
  private async getContextMessages(
    sessionId: number,
    targetMessageId: number
  ): Promise<Array<{ role: string; content: string }>> {
    const allMessages =
      await this.messageRepository.findAllBySessionId(sessionId);

    // Find the target message index
    const targetIndex = allMessages.findIndex((m) => m.id === targetMessageId);
    if (targetIndex === -1) {
      return [];
    }

    // Get previous messages (up to context limit, or all if less)
    const contextCount = Math.min(
      NUMERIC_CONSTANTS.TRANSLATION_CONTEXT_MESSAGES,
      targetIndex
    );
    const contextMessages = allMessages.slice(
      Math.max(0, targetIndex - contextCount),
      targetIndex
    );

    return contextMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  /**
   * Translate message using OpenAI with context
   */
  private async translateWithOpenAI(
    message: string,
    context: Array<{ role: string; content: string }>,
    apiKey: string,
    userId?: string,
    agentId?: number | null
  ): Promise<string> {
    const openai = this.openaiService.getClient(apiKey);

    // Build context string
    const contextString = context
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = contextString
      ? OPENAI_PROMPTS.TRANSLATION.WITH_CONTEXT(contextString, message)
      : OPENAI_PROMPTS.TRANSLATION.WITHOUT_CONTEXT(message);

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODELS.TRANSLATION,
      messages: [
        {
          role: messageRoleToOpenAI(MessageRole.SYSTEM),
          content: OPENAI_PROMPTS.TRANSLATION.SYSTEM,
        },
        {
          role: messageRoleToOpenAI(MessageRole.USER),
          content: prompt,
        },
      ],
      temperature: NUMERIC_CONSTANTS.TRANSLATION_TEMPERATURE,
      max_tokens: NUMERIC_CONSTANTS.DEFAULT_MAX_TOKENS,
    });

    const translation = completion.choices[0]?.message?.content?.trim();
    if (!translation) {
      this.logger.error('No translation returned from OpenAI');
      throw new Error('Translation failed: No response from OpenAI');
    }

    // Log the request/response
    await this.aiRequestLogService.logRequest(
      userId,
      {
        model: OPENAI_MODELS.TRANSLATION,
        messages: [
          {
            role: messageRoleToOpenAI(MessageRole.SYSTEM),
            content: OPENAI_PROMPTS.TRANSLATION.SYSTEM,
          },
          {
            role: messageRoleToOpenAI(MessageRole.USER),
            content: prompt,
          },
        ],
        temperature: NUMERIC_CONSTANTS.TRANSLATION_TEMPERATURE,
        max_tokens: NUMERIC_CONSTANTS.DEFAULT_MAX_TOKENS,
      },
      completion,
      {
        agentId,
        logType: 'TRANSLATION' as const,
      }
    );

    this.logger.debug('Translation completed');
    return translation;
  }

  /**
   * Get translations for multiple messages (for pre-loading)
   */
  async getTranslationsForMessages(
    messageIds: number[]
  ): Promise<Map<number, string>> {
    if (messageIds.length === 0) {
      return new Map();
    }

    const translations =
      await this.translationRepository.findByMessageIds(messageIds);

    const translationMap = new Map<number, string>();
    translations.forEach((t) => {
      translationMap.set(t.messageId, t.translation);
    });

    return translationMap;
  }

  /**
   * Translate message with word-level translations (on-demand)
   * Creates both word translations and full message translation
   */
  async translateMessageWithWords(
    messageId: number,
    userId: string
  ): Promise<{
    translation: string;
    wordTranslations: Array<{
      originalWord: string;
      translation: string;
      sentenceContext?: string;
    }>;
  }> {
    // Get the message
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      this.logger.warn(`Message ${messageId} not found`);
      throw new MessageNotFoundException(messageId);
    }

    // Verify user has access to this message's session
    const session = await this.sessionRepository.findByIdAndUserId(
      message.sessionId,
      userId
    );
    if (!session) {
      this.logger.warn(
        `User ${userId} does not have access to session ${message.sessionId}`
      );
      throw new SessionNotFoundException(message.sessionId);
    }

    // Check if translations already exist
    const existingTranslation =
      await this.translationRepository.findByMessageId(messageId);
    const existingWordTranslations =
      await this.wordTranslationService.getWordTranslationsForMessage(
        messageId
      );

    // If we have both translation and word translations with actual translations, return them
    const hasTranslatedWords = existingWordTranslations.some(
      (wt) => wt.translation && wt.translation.trim() !== ''
    );
    if (existingTranslation && hasTranslatedWords) {
      return {
        translation: existingTranslation.translation,
        wordTranslations: existingWordTranslations,
      };
    }

    // Get user's API key
    const apiKey = await this.apiCredentialsService.getApiKey(
      userId,
      MAGIC_STRINGS.OPENAI_PROVIDER
    );
    if (!apiKey) {
      this.logger.warn(`No API key found for user ${userId}`);
      throw new ApiKeyRequiredException();
    }

    // Get strategy based on message role
    const strategy = this.translationStrategyFactory.getStrategy(
      message.role as MessageRole
    );

    // Build context (only for assistant messages)
    let context: TranslationContext | undefined;
    if (message.role === MessageRole.ASSISTANT) {
      const contextMessages = await this.getContextMessages(
        message.sessionId,
        messageId
      );
      context = {
        conversationHistory: contextMessages,
        messageRole: message.role as MessageRole,
        agentId: session.agentId,
        userId,
      };
    } else {
      context = {
        messageRole: message.role as MessageRole,
        agentId: session.agentId,
        userId,
      };
    }

    // Translate using strategy
    const result = await strategy.translateMessageWithWords(
      messageId,
      message.content,
      apiKey,
      context
    );

    return result;
  }
}
