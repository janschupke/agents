import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { MessageTranslationService } from './message-translation.service';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';

@Controller('api/messages')
export class MessageTranslationController {
  constructor(
    private readonly translationService: MessageTranslationService
  ) {}

  @Post(':messageId/translate')
  async translateMessage(
    @Param('messageId', ParseIntPipe) messageId: number,
    @User() user: AuthenticatedUser
  ): Promise<{ translation: string }> {
    return this.translationService.translateMessage(messageId, user.id);
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
}
