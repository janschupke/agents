import { Module } from '@nestjs/common';
import { AgentController } from './bot.controller';
import { AgentService } from './bot.service';
import { AgentRepository } from './bot.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [AgentController],
  providers: [AgentService, AgentRepository],
  exports: [AgentRepository],
})
export class AgentModule {}
