import { Module } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { BotRepository } from './repository/bot.repository';
import { MemoryRepository } from '../memory/repository/memory.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BotController],
  providers: [BotService, BotRepository, MemoryRepository],
  exports: [BotRepository],
})
export class BotModule {}
