import { Module } from '@nestjs/common';
import { AdminAgentController } from './admin-agent.controller';
import { AgentModule } from '../agent/agent.module';
import { AgentMemoryModule } from '../memory/agent-memory.module';

@Module({
  imports: [AgentModule, AgentMemoryModule],
  controllers: [AdminAgentController],
})
export class AdminModule {}
