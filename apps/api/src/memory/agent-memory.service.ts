import { Injectable, Logger } from '@nestjs/common';
import { AgentMemoryRepository } from './agent-memory.repository';
import { OpenAIService } from '../openai/openai.service';
import { MEMORY_CONFIG } from '../common/constants/api.constants.js';
import { NUMERIC_CONSTANTS } from '../common/constants/numeric.constants.js';
import { MemoryExtractionService } from './services/memory-extraction.service';
import { MemoryRetrievalService } from './services/memory-retrieval.service';
import { MemorySummarizationService } from './services/memory-summarization.service';

/**
 * Orchestration service for memory operations
 * Coordinates between extraction, retrieval, and summarization services
 */
@Injectable()
export class AgentMemoryService {
  private readonly logger = new Logger(AgentMemoryService.name);

  constructor(
    private readonly memoryRepository: AgentMemoryRepository,
    private readonly openaiService: OpenAIService,
    private readonly memoryExtractionService: MemoryExtractionService,
    private readonly memoryRetrievalService: MemoryRetrievalService,
    private readonly memorySummarizationService: MemorySummarizationService
  ) {}

  /**
   * Extract key insights from messages (delegates to MemoryExtractionService)
   */
  async extractKeyInsights(
    messages: Array<{ role: string; content: string }>,
    apiKey: string
  ): Promise<string[]> {
    return this.memoryExtractionService.extractKeyInsights(messages, apiKey);
  }

  async createMemory(
    agentId: number,
    userId: string,
    sessionId: number,
    sessionName: string | null,
    messages: Array<{ role: string; content: string }>,
    apiKey: string
  ): Promise<void> {
    const insights = await this.extractKeyInsights(messages, apiKey);

    if (insights.length === 0) {
      this.logger.log('No insights extracted, skipping memory creation');
      return;
    }

    const context = {
      sessionId,
      sessionName,
      messageCount: messages.length,
    };

    // Create a memory for each insight
    for (const insight of insights) {
      try {
        const embedding = await this.openaiService.generateEmbedding(
          insight,
          apiKey
        );

        if (embedding && embedding.length > 0) {
          await this.memoryRepository.create(
            agentId,
            userId,
            insight,
            context,
            embedding
          );
          this.logger.log(
            `Created memory for agent ${agentId}, user ${userId}: ${insight.substring(0, 50)}...`
          );
        }
      } catch (error) {
        this.logger.error('Error creating memory for insight:', error);
        // Continue with other insights even if one fails
      }
    }
  }

  async shouldSummarize(agentId: number, userId: string): Promise<boolean> {
    const updateCount = await this.memoryRepository.getUpdateCount(
      agentId,
      userId
    );
    return updateCount >= MEMORY_CONFIG.MEMORY_SUMMARIZATION_INTERVAL;
  }

  async summarizeMemories(
    agentId: number,
    userId: string,
    apiKey: string
  ): Promise<void> {
    this.logger.log(
      `Starting memory summarization for agent ${agentId}, user ${userId}`
    );

    const memories = await this.memoryRepository.findForSummarization(
      agentId,
      userId,
      NUMERIC_CONSTANTS.MEMORY_SUMMARIZATION_LIMIT
    );

    if (memories.length === 0) {
      this.logger.log('No memories to summarize');
      return;
    }

    // Group similar memories using embeddings
    const groups =
      await this.memorySummarizationService.groupSimilarMemories(memories);

    // Summarize each group
    for (const group of groups) {
      if (group.length === 1) {
        // Single memory, keep as is but may still benefit from compression
        continue;
      }

      try {
        const summary =
          await this.memorySummarizationService.summarizeMemoryGroup(
            group,
            apiKey
          );
        if (summary && summary.trim().length > 0) {
          // Create new summarized memory
          const embedding = await this.openaiService.generateEmbedding(
            summary,
            apiKey
          );

          if (embedding && embedding.length > 0) {
            // Use context from the most recent memory in the group
            const latestMemory = group[group.length - 1];
            await this.memoryRepository.create(
              agentId,
              userId,
              summary,
              latestMemory.context,
              embedding
            );

            // Delete old memories in the group
            const idsToDelete = group.map((m) => m.id);
            await this.memoryRepository.deleteMany(idsToDelete);

            this.logger.log(
              `Summarized ${group.length} memories into: ${summary.substring(0, 50)}...`
            );
          }
        }
      } catch (error) {
        this.logger.error('Error summarizing memory group:', error);
        // Continue with other groups
      }
    }

    // Reset update count
    await this.memoryRepository.resetUpdateCount(agentId, userId);
    this.logger.log('Memory summarization completed');
  }

  /**
   * Get memories for context (delegates to MemoryRetrievalService)
   */
  async getMemoriesForContext(
    agentId: number,
    userId: string,
    queryText: string,
    apiKey: string
  ): Promise<string[]> {
    return this.memoryRetrievalService.getMemoriesForContext(
      agentId,
      userId,
      queryText,
      apiKey
    );
  }
}
