import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MessagePreparationService } from './services/message-preparation.service';
import { OpenAIChatService } from './services/openai-chat.service';
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

@Module({
  imports: [
    AgentModule,
    UserModule,
    ApiCredentialsModule,
    SystemConfigModule,
    MessageTranslationModule,
    AgentMemoryModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    MessagePreparationService,
    OpenAIChatService,
    SessionService,
    SessionRepository,
    MessageRepository,
    OpenAIService,
  ],
})
export class ChatModule {}
