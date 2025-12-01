import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { BotRepository } from '../bot/bot.repository';
import { SessionRepository } from '../session/session.repository';
import { MessageRepository } from '../message/message.repository';
import { MemoryRepository } from '../memory/memory.repository';
import { OpenAIService } from '../openai/openai.service';
import { UserModule } from '../user/user.module';
import { ApiCredentialsModule } from '../api-credentials/api-credentials.module';
import { SystemConfigModule } from '../system-config/system-config.module';
import { MessageTranslationModule } from '../message-translation/message-translation.module';

@Module({
  imports: [UserModule, ApiCredentialsModule, SystemConfigModule, MessageTranslationModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    BotRepository,
    SessionRepository,
    MessageRepository,
    MemoryRepository,
    OpenAIService,
  ],
})
export class ChatModule {}
