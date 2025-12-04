import { Module, forwardRef } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentRepository } from './agent.repository';
import { AgentConfigService } from './services/agent-config.service';
import { LanguageAssistantService } from './services/language-assistant.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { SessionRepository } from '../session/session.repository';

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [AgentController],
  providers: [
    AgentService,
    AgentRepository,
    AgentConfigService,
    LanguageAssistantService,
    SessionRepository,
  ],
  exports: [AgentRepository, AgentConfigService, LanguageAssistantService],
})
export class AgentModule {}
