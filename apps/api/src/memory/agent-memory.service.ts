import { Injectable, Logger } from '@nestjs/common';
import { AgentMemoryRepository } from './agent-memory.repository';
import { OpenAIService } from '../openai/openai.service';
import { MEMORY_CONFIG } from '../common/constants/api.constants.js';
import { OPENAI_PROMPTS } from '../common/constants/openai-prompts.constants.js';
import { NUMERIC_CONSTANTS } from '../common/constants/numeric.constants.js';

@Injectable()
export class AgentMemoryService {
  private readonly logger = new Logger(AgentMemoryService.name);

  constructor(
    private readonly memoryRepository: AgentMemoryRepository,
    private readonly openaiService: OpenAIService
  ) {}

  async extractKeyInsights(
    messages: Array<{ role: string; content: string }>,
    apiKey: string
  ): Promise<string[]> {
    if (messages.length === 0) {
      return [];
    }

    // Get the last N messages for context
    const recentMessages = messages.slice(
      -NUMERIC_CONSTANTS.MEMORY_EXTRACTION_MESSAGES
    );
    const conversationText = recentMessages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    const prompt = OPENAI_PROMPTS.MEMORY.EXTRACTION.USER(
      conversationText,
      MEMORY_CONFIG.MAX_KEY_INSIGHTS_PER_UPDATE,
      MEMORY_CONFIG.MAX_MEMORY_LENGTH
    );

    try {
      const openai = this.openaiService.getClient(apiKey);
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: OPENAI_PROMPTS.MEMORY.EXTRACTION.SYSTEM,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: NUMERIC_CONSTANTS.TRANSLATION_TEMPERATURE,
        max_tokens: NUMERIC_CONSTANTS.MEMORY_EXTRACTION_MAX_TOKENS,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return [];
      }

      // Parse insights from response
      const insights = response
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .filter((line) => !line.match(/^\d+[.)]/)) // Remove numbering
        .map((line) => line.replace(/^[-•*]\s*/, '')) // Remove bullets
        .filter((line) => line.length <= MEMORY_CONFIG.MAX_MEMORY_LENGTH)
        .slice(0, MEMORY_CONFIG.MAX_KEY_INSIGHTS_PER_UPDATE);

      return insights;
    } catch (error) {
      this.logger.error('Error extracting key insights:', error);
      return [];
    }
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
    const groups = await this.groupSimilarMemories(memories, apiKey);

    // Summarize each group
    for (const group of groups) {
      if (group.length === 1) {
        // Single memory, keep as is but may still benefit from compression
        continue;
      }

      try {
        const summary = await this.summarizeMemoryGroup(group, apiKey);
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

  async getMemoriesForContext(
    agentId: number,
    userId: string,
    queryText: string,
    apiKey: string
  ): Promise<string[]> {
    try {
      const queryVector = await this.openaiService.generateEmbedding(
        queryText,
        apiKey
      );

      const similar = await this.memoryRepository.findSimilar(
        queryVector,
        agentId,
        userId,
        MEMORY_CONFIG.MAX_SIMILAR_MEMORIES,
        MEMORY_CONFIG.SIMILARITY_THRESHOLD
      );

      // Format memories with date
      return similar.map((memory) => {
        const date = new Date(memory.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        return `${date} - ${memory.keyPoint}`;
      });
    } catch (error) {
      this.logger.error('Error retrieving memories for context:', error);
      return [];
    }
  }

  private async groupSimilarMemories(
    memories: Array<{
      id: number;
      keyPoint: string;
      vectorEmbedding: number[] | null;
      context: unknown;
      createdAt: Date;
    }>,
    _apiKey: string
  ): Promise<
    Array<
      Array<{
        id: number;
        keyPoint: string;
        context: unknown;
        createdAt: Date;
      }>
    >
  > {
    // Simple grouping: memories with similar embeddings
    const groups: Array<
      Array<{
        id: number;
        keyPoint: string;
        context: unknown;
        createdAt: Date;
      }>
    > = [];
    const processed = new Set<number>();

    for (let i = 0; i < memories.length; i++) {
      if (processed.has(memories[i].id)) continue;

      const group = [memories[i]];
      processed.add(memories[i].id);

      if (!memories[i].vectorEmbedding) continue;

      // Find similar memories
      for (let j = i + 1; j < memories.length; j++) {
        if (processed.has(memories[j].id)) continue;
        if (!memories[j].vectorEmbedding) continue;

        const similarity = this.cosineSimilarity(
          memories[i].vectorEmbedding!,
          memories[j].vectorEmbedding!
        );

        // Group if similarity is high
        if (similarity >= NUMERIC_CONSTANTS.MEMORY_SIMILARITY_THRESHOLD) {
          group.push(memories[j]);
          processed.add(memories[j].id);
        }
      }

      groups.push(
        group.map((m) => ({
          id: m.id,
          keyPoint: m.keyPoint,
          context: m.context,
          createdAt: m.createdAt,
        }))
      );
    }

    return groups;
  }

  private async summarizeMemoryGroup(
    group: Array<{
      keyPoint: string;
      context: unknown;
      createdAt: Date;
    }>,
    apiKey: string
  ): Promise<string> {
    const memoriesText = group
      .map((m, i) => `${i + 1}. ${m.keyPoint}`)
      .join('\n');

    const prompt = OPENAI_PROMPTS.MEMORY.SUMMARIZATION.USER(
      memoriesText,
      MEMORY_CONFIG.MAX_MEMORY_LENGTH
    );

    try {
      const openai = this.openaiService.getClient(apiKey);
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: OPENAI_PROMPTS.MEMORY.SUMMARIZATION.SYSTEM,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: NUMERIC_CONSTANTS.TRANSLATION_TEMPERATURE,
        max_tokens: NUMERIC_CONSTANTS.MEMORY_SUMMARIZATION_MAX_TOKENS,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return '';
      }

      return response.trim().substring(0, MEMORY_CONFIG.MAX_MEMORY_LENGTH);
    } catch (error) {
      this.logger.error('Error summarizing memory group:', error);
      return '';
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }
}
