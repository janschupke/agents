import { Module } from '@nestjs/common';
import { AgentMemoryController } from './agent-memory.controller';
import { AgentMemoryService } from './agent-memory.service';
import { AgentMemoryRepository } from './agent-memory.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenAIService } from '../openai/openai.service';
import { ApiCredentialsModule } from '../api-credentials/api-credentials.module';

@Module({
  imports: [PrismaModule, ApiCredentialsModule],
  controllers: [AgentMemoryController],
  providers: [AgentMemoryService, AgentMemoryRepository, OpenAIService],
  exports: [AgentMemoryService, AgentMemoryRepository],
})
export class AgentMemoryModule {}
