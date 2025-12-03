import { Module } from '@nestjs/common';
import { AgentMemoryController } from './agent-memory.controller';
import { AgentMemoryService } from './agent-memory.service';
import { AgentMemoryRepository } from './agent-memory.repository';
import { MemoryExtractionService } from './services/memory-extraction.service';
import { MemoryRetrievalService } from './services/memory-retrieval.service';
import { MemorySummarizationService } from './services/memory-summarization.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenAIService } from '../openai/openai.service';
import { ApiCredentialsModule } from '../api-credentials/api-credentials.module';

@Module({
  imports: [PrismaModule, ApiCredentialsModule],
  controllers: [AgentMemoryController],
  providers: [
    AgentMemoryService,
    AgentMemoryRepository,
    MemoryExtractionService,
    MemoryRetrievalService,
    MemorySummarizationService,
    OpenAIService,
  ],
  exports: [AgentMemoryService, AgentMemoryRepository],
})
export class AgentMemoryModule {}
