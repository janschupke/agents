import { Module } from '@nestjs/common';
import { AgentMemoryController } from './agent-memory.controller';
import { AgentMemoryService } from './agent-memory.service';
import { AgentMemoryRepository } from './agent-memory.repository';
import { MemoryExtractionService } from './services/memory-extraction.service';
import { MemoryRetrievalService } from './services/memory-retrieval.service';
import { MemorySummarizationService } from './services/memory-summarization.service';
import { MemorySummaryService } from './services/memory-summary.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenAIService } from '../openai/openai.service';
import { ApiCredentialsModule } from '../api-credentials/api-credentials.module';
import { AgentModule } from '../agent/agent.module';
import { AiRequestLogModule } from '../ai-request-log/ai-request-log.module';

@Module({
  imports: [PrismaModule, ApiCredentialsModule, AgentModule, AiRequestLogModule],
  controllers: [AgentMemoryController],
  providers: [
    AgentMemoryService,
    AgentMemoryRepository,
    MemoryExtractionService,
    MemoryRetrievalService,
    MemorySummarizationService,
    MemorySummaryService,
    OpenAIService,
  ],
  exports: [AgentMemoryService, AgentMemoryRepository, MemorySummaryService],
})
export class AgentMemoryModule {}
