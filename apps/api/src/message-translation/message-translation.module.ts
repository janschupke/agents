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
import { AiRequestLogModule } from '../ai-request-log/ai-request-log.module';
import { InitialTranslationStrategy } from './strategies/initial-translation.strategy';
import { OnDemandTranslationStrategy } from './strategies/on-demand-translation.strategy';
import { TranslationStrategyFactory } from './translation-strategy.factory';
import { WordParsingService } from './services/word-parsing.service';
import { WordTranslationOpenAIService } from './services/word-translation-openai.service';
import { WordTranslationStorageService } from './services/word-translation-storage.service';

@Module({
  imports: [ApiCredentialsModule, AiRequestLogModule],
  controllers: [MessageTranslationController],
  providers: [
    MessageTranslationService,
    MessageTranslationRepository,
    WordTranslationService,
    MessageWordTranslationRepository,
    MessageRepository,
    SessionRepository,
    OpenAIService,
    // Word translation sub-services
    WordParsingService,
    WordTranslationOpenAIService,
    WordTranslationStorageService,
    // Translation strategies
    InitialTranslationStrategy,
    OnDemandTranslationStrategy,
    TranslationStrategyFactory,
  ],
  exports: [
    MessageTranslationService,
    WordTranslationService,
    TranslationStrategyFactory,
  ],
})
export class MessageTranslationModule {}
