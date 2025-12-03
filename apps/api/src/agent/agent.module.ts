import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentRepository } from './agent.repository';
import { AgentConfigService } from './services/agent-config.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [AgentController],
  providers: [AgentService, AgentRepository, AgentConfigService],
  exports: [AgentRepository, AgentConfigService],
})
export class AgentModule {}
