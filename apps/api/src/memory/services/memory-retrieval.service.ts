import { Injectable, Logger } from '@nestjs/common';
import { AgentMemoryRepository } from '../agent-memory.repository';
import { OpenAIService } from '../../openai/openai.service';
import { MEMORY_CONFIG } from '../../common/constants/api.constants.js';

/**
 * Service responsible for retrieving relevant memories for context
 */
@Injectable()
export class MemoryRetrievalService {
  private readonly logger = new Logger(MemoryRetrievalService.name);

  constructor(
    private readonly memoryRepository: AgentMemoryRepository,
    private readonly openaiService: OpenAIService
  ) {}

  /**
   * Retrieve relevant memories for a given query using vector similarity
   */
  async getMemoriesForContext(
    agentId: number,
    userId: string,
    queryText: string,
    apiKey: string
  ): Promise<string[]> {
    this.logger.debug(
      `Retrieving memories for agent ${agentId}, user ${userId}, query: ${queryText.substring(0, 50)}...`
    );

    try {
      // Generate embedding for the query
      const queryVector = await this.openaiService.generateEmbedding(
        queryText,
        apiKey
      );

      // Find similar memories using vector similarity
      const similar = await this.memoryRepository.findSimilar(
        queryVector,
        agentId,
        userId,
        MEMORY_CONFIG.MAX_SIMILAR_MEMORIES,
        MEMORY_CONFIG.SIMILARITY_THRESHOLD
      );

      this.logger.debug(`Found ${similar.length} similar memories`);

      // Format memories with date for context
      const formattedMemories = similar.map((memory) => {
        const date = new Date(memory.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        return `${date} - ${memory.keyPoint}`;
      });

      return formattedMemories;
    } catch (error) {
      this.logger.error('Error retrieving memories for context:', error);
      return [];
    }
  }
}
