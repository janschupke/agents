import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MessageTranslationService } from './message-translation.service';
import { WordTranslationService } from './word-translation.service';
import { MessageRepository } from '../message/message.repository';
import { SessionRepository } from '../session/session.repository';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';
import { API_ROUTES } from '../common/constants/api-routes.constants.js';

@Controller(API_ROUTES.MESSAGES.BASE)
export class MessageTranslationController {
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
    return this.translationService.translateMessage(messageId, user.id);
  }

  @Post(':messageId/translate-with-words')
  async translateMessageWithWords(
    @Param('messageId', ParseIntPipe) messageId: number,
    @User() user: AuthenticatedUser
  ): Promise<{
    translation: string;
    wordTranslations: Array<{ originalWord: string; translation: string; sentenceContext?: string }>;
  }> {
    return this.translationService.translateMessageWithWords(messageId, user.id);
  }

  @Get('translations')
  async getTranslations(
    @Query('messageIds') messageIds: string, // Comma-separated IDs
    @User() user: AuthenticatedUser
  ): Promise<Record<number, string>> {
    const ids = messageIds
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
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
  ): Promise<{ wordTranslations: Array<{ originalWord: string; translation: string; sentenceContext?: string }> }> {
    // Verify access
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
    }

    const session = await this.sessionRepository.findByIdAndUserId(
      message.sessionId,
      user.id
    );
    if (!session) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }

    const wordTranslations =
      await this.wordTranslationService.getWordTranslationsForMessage(messageId);

    return { wordTranslations };
  }

  @Get(':messageId/translations')
  async getMessageTranslations(
    @Param('messageId', ParseIntPipe) messageId: number,
    @User() user: AuthenticatedUser
  ): Promise<{
    translation?: string;
    wordTranslations: Array<{ originalWord: string; translation: string; sentenceContext?: string }>;
  }> {
    // Verify access
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
    }

    const session = await this.sessionRepository.findByIdAndUserId(
      message.sessionId,
      user.id
    );
    if (!session) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }

    const translation = await this.translationService
      .getTranslationsForMessages([messageId])
      .then((map) => map.get(messageId))
      .catch(() => undefined);

    const wordTranslations =
      await this.wordTranslationService.getWordTranslationsForMessage(messageId);

    return {
      translation,
      wordTranslations,
    };
  }
}
