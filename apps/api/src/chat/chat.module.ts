import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AgentRepository } from '../agent/agent.repository';
import { SessionRepository } from '../session/session.repository';
import { MessageRepository } from '../message/message.repository';
import { AgentMemoryModule } from '../memory/agent-memory.module';
import { OpenAIService } from '../openai/openai.service';
import { UserModule } from '../user/user.module';
import { ApiCredentialsModule } from '../api-credentials/api-credentials.module';
import { SystemConfigModule } from '../system-config/system-config.module';
import { MessageTranslationModule } from '../message-translation/message-translation.module';

@Module({
  imports: [
    UserModule,
    ApiCredentialsModule,
    SystemConfigModule,
    MessageTranslationModule,
    AgentMemoryModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    AgentRepository,
    SessionRepository,
    MessageRepository,
    OpenAIService,
  ],
})
export class ChatModule {}
