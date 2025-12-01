import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MessageTranslationRepository } from './message-translation.repository';
import { MessageRepository } from '../message/message.repository';
import { SessionRepository } from '../session/session.repository';
import { OpenAIService } from '../openai/openai.service';
import { ApiCredentialsService } from '../api-credentials/api-credentials.service';

@Injectable()
export class MessageTranslationService {
  constructor(
    private readonly translationRepository: MessageTranslationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly openaiService: OpenAIService,
    private readonly apiCredentialsService: ApiCredentialsService
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

    // Get previous messages (up to 10, or all if less)
    const contextCount = Math.min(10, targetIndex);
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
      ? `Translate the following message to English. Consider the conversation context to provide an accurate translation that preserves meaning and context.

Previous conversation:
${contextString}

Message to translate:
${message}

Translation:`
      : `Translate the following message to English:
${message}

Translation:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use cheaper model for translations
      messages: [
        {
          role: 'system',
          content:
            'You are a professional translator. Translate the given message to English, preserving context, tone, and meaning. Only return the translation, no additional text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
      max_tokens: 1000,
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
}
