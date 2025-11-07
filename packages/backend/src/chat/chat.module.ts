import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { BotRepository } from '../bot/repository/bot.repository.js';
import { SessionRepository } from '../session/repository/session.repository.js';
import { MessageRepository } from '../message/repository/message.repository.js';
import { MemoryRepository } from '../memory/repository/memory.repository.js';
import { OpenAIService } from '../openai/openai.service.js';

@Module({
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
