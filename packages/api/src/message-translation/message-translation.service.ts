import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MessageTranslationRepository } from './message-translation.repository';
import { MessageRepository } from '../message/message.repository';
import { SessionRepository } from '../session/session.repository';
import { OpenAIService } from '../openai/openai.service';
import { ApiCredentialsService } from '../api-credentials/api-credentials.service';
import { WordTranslationService } from './word-translation.service';
import { OPENAI_PROMPTS } from '../common/constants/openai-prompts.constants.js';
import { NUMERIC_CONSTANTS } from '../common/constants/numeric.constants.js';

@Injectable()
export class MessageTranslationService {
  constructor(
    private readonly translationRepository: MessageTranslationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly openaiService: OpenAIService,
    private readonly apiCredentialsService: ApiCredentialsService,
    private readonly wordTranslationService: WordTranslationService
  ) {}

  /**
   * Translate a message to English with conversation context
   */
  async translateMessage(
    messageId: number,
    userId: string
  ): Promise<{ translation: string }> {
    // Check if translation already exists
    const existing = await this.translationRepository.findByMessageId(messageId);
    if (existing) {
      return { translation: existing.translation };
    }

    // Get the message
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
    }

    // Verify user has access to this message's session
    const session = await this.sessionRepository.findByIdAndUserId(
      message.sessionId,
      userId
    );
    if (!session) {
      throw new HttpException(
        'Access denied: Session not found',
        HttpStatus.FORBIDDEN
      );
    }

    // Get conversation context (previous messages for context)
    const contextMessages = await this.getContextMessages(
      message.sessionId,
      messageId
    );

    // Get user's API key
    const apiKey = await this.apiCredentialsService.getApiKey(userId, 'openai');
    if (!apiKey) {
      throw new HttpException(
        'OpenAI API key is required. Please set your API key in your profile.',
        HttpStatus.BAD_REQUEST
      );
    }

    // Call OpenAI to translate
    const translation = await this.translateWithOpenAI(
      message.content,
      contextMessages,
      apiKey
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
    const contextCount = Math.min(NUMERIC_CONSTANTS.TRANSLATION_CONTEXT_MESSAGES, targetIndex);
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
    apiKey: string
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
      model: 'gpt-4o-mini', // Use cheaper model for translations
      messages: [
        {
          role: 'system',
          content: OPENAI_PROMPTS.TRANSLATION.SYSTEM,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: NUMERIC_CONSTANTS.TRANSLATION_TEMPERATURE,
      max_tokens: NUMERIC_CONSTANTS.DEFAULT_MAX_TOKENS,
    });

    const translation = completion.choices[0]?.message?.content?.trim();
    if (!translation) {
      throw new HttpException(
        'Translation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

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
      throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
    }

    // Verify user has access to this message's session
    const session = await this.sessionRepository.findByIdAndUserId(
      message.sessionId,
      userId
    );
    if (!session) {
      throw new HttpException(
        'Access denied: Session not found',
        HttpStatus.FORBIDDEN
      );
    }

    // Check if translations already exist
    const existingTranslation = await this.translationRepository.findByMessageId(messageId);
    const existingWordTranslations = await this.wordTranslationService.getWordTranslationsForMessage(messageId);
    
    if (existingTranslation && existingWordTranslations.length > 0) {
      return {
        translation: existingTranslation.translation,
        wordTranslations: existingWordTranslations,
      };
    }

    // Get user's API key
    const apiKey = await this.apiCredentialsService.getApiKey(userId, 'openai');
    if (!apiKey) {
      throw new HttpException(
        'OpenAI API key is required. Please set your API key in your profile.',
        HttpStatus.BAD_REQUEST
      );
    }

    // Translate words (this will also create full translation)
    await this.wordTranslationService.translateWordsInMessage(
      messageId,
      message.content,
      apiKey
    );

    // Get the created translations
    const translation = await this.translationRepository.findByMessageId(messageId);
    const wordTranslations = await this.wordTranslationService.getWordTranslationsForMessage(messageId);

    if (!translation || wordTranslations.length === 0) {
      throw new HttpException(
        'Translation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      translation: translation.translation,
      wordTranslations,
    };
  }
}
