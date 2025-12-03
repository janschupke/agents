import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { MessageTranslationService } from './message-translation.service';
import { WordTranslationService } from './word-translation.service';
import { MessageRepository } from '../message/message.repository';
import { SessionRepository } from '../session/session.repository';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';
import { API_ROUTES } from '../common/constants/api-routes.constants.js';
import { MAGIC_STRINGS } from '../common/constants/error-messages.constants.js';
import { GetTranslationsQueryDto } from '../common/dto/message-translation.dto';
import {
  MessageNotFoundException,
  SessionNotFoundException,
} from '../common/exceptions';

@Controller(API_ROUTES.MESSAGES.BASE)
export class MessageTranslationController {
  private readonly logger = new Logger(MessageTranslationController.name);

  constructor(
    private readonly translationService: MessageTranslationService,
    private readonly wordTranslationService: WordTranslationService,
    private readonly messageRepository: MessageRepository,
    private readonly sessionRepository: SessionRepository
  ) {}

  @Post(':messageId/translate')
  async translateMessage(
    @Param('messageId', ParseIntPipe) messageId: number,
    @User() user: AuthenticatedUser
  ): Promise<{ translation: string }> {
    this.logger.log(`Translating message ${messageId} for user ${user.id}`);
    return this.translationService.translateMessage(messageId, user.id);
  }

  @Post(':messageId/translate-with-words')
  async translateMessageWithWords(
    @Param('messageId', ParseIntPipe) messageId: number,
    @User() user: AuthenticatedUser
  ): Promise<{
    translation: string;
    wordTranslations: Array<{
      originalWord: string;
      translation: string;
      sentenceContext?: string;
    }>;
  }> {
    this.logger.log(
      `Translating message ${messageId} with words for user ${user.id}`
    );
    return this.translationService.translateMessageWithWords(
      messageId,
      user.id
    );
  }

  @Get('translations')
  async getTranslations(
    @Query() query: GetTranslationsQueryDto,
    @User() _user: AuthenticatedUser
  ): Promise<Record<number, string>> {
    this.logger.debug(
      `Getting translations for messageIds: ${query.messageIds}`
    );
    const ids = query.messageIds
      .split(',')
      .map((id) => parseInt(id.trim(), MAGIC_STRINGS.PARSE_INT_BASE))
      .filter((id) => !isNaN(id));

    const translations =
      await this.translationService.getTranslationsForMessages(ids);

    // Convert Map to object
    const result: Record<number, string> = {};
    translations.forEach((translation, messageId) => {
      result[messageId] = translation;
    });

    return result;
  }

  @Get(':messageId/word-translations')
  async getWordTranslations(
    @Param('messageId', ParseIntPipe) messageId: number,
    @User() user: AuthenticatedUser
  ): Promise<{
    wordTranslations: Array<{
      originalWord: string;
      translation: string;
      sentenceContext?: string;
    }>;
  }> {
    // Verify access
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new MessageNotFoundException(messageId);
    }

    const session = await this.sessionRepository.findByIdAndUserId(
      message.sessionId,
      user.id
    );
    if (!session) {
      throw new SessionNotFoundException(message.sessionId);
    }

    const wordTranslations =
      await this.wordTranslationService.getWordTranslationsForMessage(
        messageId
      );

    return { wordTranslations };
  }

  @Get(':messageId/translations')
  async getMessageTranslations(
    @Param('messageId', ParseIntPipe) messageId: number,
    @User() user: AuthenticatedUser
  ): Promise<{
    translation?: string;
    wordTranslations: Array<{
      originalWord: string;
      translation: string;
      sentenceContext?: string;
    }>;
  }> {
    // Verify access
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new MessageNotFoundException(messageId);
    }

    const session = await this.sessionRepository.findByIdAndUserId(
      message.sessionId,
      user.id
    );
    if (!session) {
      throw new SessionNotFoundException(message.sessionId);
    }

    const translation = await this.translationService
      .getTranslationsForMessages([messageId])
      .then((map) => map.get(messageId))
      .catch(() => undefined);

    const wordTranslations =
      await this.wordTranslationService.getWordTranslationsForMessage(
        messageId
      );

    return {
      translation,
      wordTranslations,
    };
  }
}
