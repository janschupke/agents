import { Module } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { BotRepository } from './bot.repository';
import { MemoryRepository } from '../memory/memory.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [BotController],
  providers: [BotService, BotRepository, MemoryRepository],
  exports: [BotRepository],
})
export class BotModule {}
