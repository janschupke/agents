import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { BotRepository } from '../bot/repository/bot.repository';
import { SessionRepository } from '../session/repository/session.repository';
import { MessageRepository } from '../message/repository/message.repository';
import { MemoryRepository } from '../memory/repository/memory.repository';
import { OpenAIService } from '../openai/openai.service';
import { UserModule } from '../user/user.module';
import { ApiCredentialsModule } from '../api-credentials/api-credentials.module';

@Module({
  imports: [UserModule, ApiCredentialsModule],
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
