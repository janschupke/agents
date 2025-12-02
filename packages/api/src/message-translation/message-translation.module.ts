import { Module } from '@nestjs/common';
import { MessageTranslationController } from './message-translation.controller';
import { MessageTranslationService } from './message-translation.service';
import { MessageTranslationRepository } from './message-translation.repository';
import { WordTranslationService } from './word-translation.service';
import { MessageWordTranslationRepository } from './message-word-translation.repository';
import { MessageRepository } from '../message/message.repository';
import { SessionRepository } from '../session/session.repository';
import { OpenAIService } from '../openai/openai.service';
import { ApiCredentialsModule } from '../api-credentials/api-credentials.module';

@Module({
  imports: [ApiCredentialsModule],
  controllers: [MessageTranslationController],
  providers: [
    MessageTranslationService,
    MessageTranslationRepository,
    WordTranslationService,
    MessageWordTranslationRepository,
    MessageRepository,
    SessionRepository,
    OpenAIService,
  ],
  exports: [MessageTranslationService, WordTranslationService],
})
export class MessageTranslationModule {}
