import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MessagePreparationService } from './services/message-preparation.service';
import { PromptTransformationService } from './services/prompt-transformation.service';
import { BehaviorRulesTransformationService } from './services/behavior-rules-transformation.service';
import { OpenAIChatService } from './services/openai-chat.service';
import { ChatOrchestrationService } from './services/chat-orchestration.service';
import { TranslationExtractionService } from './services/translation-extraction.service';
import { AgentModule } from '../agent/agent.module';
import { SessionRepository } from '../session/session.repository';
import { SessionService } from '../session/session.service';
import { MessageRepository } from '../message/message.repository';
import { AgentMemoryModule } from '../memory/agent-memory.module';
import { OpenAIService } from '../openai/openai.service';
import { UserModule } from '../user/user.module';
import { ApiCredentialsModule } from '../api-credentials/api-credentials.module';
import { SystemConfigModule } from '../system-config/system-config.module';
import { MessageTranslationModule } from '../message-translation/message-translation.module';
import { SavedWordModule } from '../saved-word/saved-word.module';
import { AiRequestLogModule } from '../ai-request-log/ai-request-log.module';
import { AgentRepository } from '../agent/agent.repository';
import { AgentConfigService } from '../agent/services/agent-config.service';

@Module({
  imports: [
    AgentModule,
    UserModule,
    ApiCredentialsModule,
    SystemConfigModule,
    MessageTranslationModule,
    AgentMemoryModule,
    SavedWordModule,
    AiRequestLogModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatOrchestrationService,
    TranslationExtractionService,
    MessagePreparationService,
    PromptTransformationService,
    BehaviorRulesTransformationService,
    OpenAIChatService,
    SessionService,
    SessionRepository,
    MessageRepository,
    OpenAIService,
    AgentRepository,
    AgentConfigService,
  ],
})
export class ChatModule {}
