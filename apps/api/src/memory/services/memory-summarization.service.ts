import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../../openai/openai.service';
import {
  MEMORY_CONFIG,
  OPENAI_MODELS,
} from '../../common/constants/api.constants.js';
import { OPENAI_PROMPTS } from '../../common/constants/openai-prompts.constants.js';
import { NUMERIC_CONSTANTS } from '../../common/constants/numeric.constants.js';

interface MemoryForSummarization {
  id: number;
  keyPoint: string;
  vectorEmbedding: number[] | null;
  context: unknown;
  createdAt: Date;
}

interface MemoryGroup {
  id: number;
  keyPoint: string;
  context: unknown;
  createdAt: Date;
}

/**
 * Service responsible for grouping and summarizing similar memories
 */
@Injectable()
export class MemorySummarizationService {
  private readonly logger = new Logger(MemorySummarizationService.name);

  constructor(private readonly openaiService: OpenAIService) {}

  /**
   * Group similar memories using cosine similarity
   */
  async groupSimilarMemories(
    memories: MemoryForSummarization[]
  ): Promise<MemoryGroup[][]> {
    this.logger.debug(`Grouping ${memories.length} memories by similarity`);

    const groups: MemoryGroup[][] = [];
    const processed = new Set<number>();

    for (let i = 0; i < memories.length; i++) {
      if (processed.has(memories[i].id)) continue;

      const group: MemoryGroup[] = [
        {
          id: memories[i].id,
          keyPoint: memories[i].keyPoint,
          context: memories[i].context,
          createdAt: memories[i].createdAt,
        },
      ];
      processed.add(memories[i].id);

      if (!memories[i].vectorEmbedding) {
        // No embedding, add as single-item group and continue
        groups.push(group);
        continue;
      }

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
          group.push({
            id: memories[j].id,
            keyPoint: memories[j].keyPoint,
            context: memories[j].context,
            createdAt: memories[j].createdAt,
          });
          processed.add(memories[j].id);
        }
      }

      groups.push(group);
    }

    this.logger.debug(`Grouped memories into ${groups.length} groups`);
    return groups;
  }

  /**
   * Summarize a group of similar memories into a single memory
   */
  async summarizeMemoryGroup(
    group: MemoryGroup[],
    apiKey: string
  ): Promise<string> {
    if (group.length === 0) {
      return '';
    }

    if (group.length === 1) {
      // Single memory, return as-is
      return group[0].keyPoint;
    }

    this.logger.debug(`Summarizing group of ${group.length} memories`);

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
        model: OPENAI_MODELS.MEMORY,
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
        this.logger.warn('No response from OpenAI for memory summarization');
        return '';
      }

      const summary = response
        .trim()
        .substring(0, MEMORY_CONFIG.MAX_MEMORY_LENGTH);
      this.logger.debug(`Generated summary: ${summary.substring(0, 50)}...`);
      return summary;
    } catch (error) {
      this.logger.error('Error summarizing memory group:', error);
      return '';
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
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
