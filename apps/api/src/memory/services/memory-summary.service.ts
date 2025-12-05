import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '../../openai/openai.service';
import { AgentMemoryRepository } from '../agent-memory.repository';
import { AgentRepository } from '../../agent/agent.repository';
import { OPENAI_PROMPTS } from '../../common/constants/openai-prompts.constants.js';
import { OPENAI_MODELS } from '../../common/constants/api.constants.js';
import { NUMERIC_CONSTANTS } from '../../common/constants/numeric.constants.js';

/**
 * Service responsible for generating memory summaries for client display
 * Summaries describe how memories affect agent's feelings and behavioral tendencies
 */
@Injectable()
export class MemorySummaryService {
  private readonly logger = new Logger(MemorySummaryService.name);

  constructor(
    private readonly memoryRepository: AgentMemoryRepository,
    private readonly agentRepository: AgentRepository,
    private readonly openaiService: OpenAIService
  ) {}

  /**
   * Generate or update memory summary for an agent
   * This summary is for client display only, not used in prompts
   */
  async generateSummary(
    agentId: number,
    userId: string,
    apiKey: string
  ): Promise<void> {
    this.logger.debug(
      `Generating memory summary for agent ${agentId}, user ${userId}`
    );

    try {
      // Fetch all memories for the agent
      const memories = await this.memoryRepository.findAllByAgentId(
        agentId,
        userId,
        undefined // No limit - get all memories
      );

      if (memories.length === 0) {
        // No memories, clear the summary
        await this.agentRepository.updateMemorySummary(agentId, null);
        this.logger.debug(
          `No memories found for agent ${agentId}, cleared summary`
        );
        return;
      }

      // Build memories text
      const memoriesText = memories
        .map((m, i) => `${i + 1}. ${m.keyPoint}`)
        .join('\n');

      // Generate summary using OpenAI
      const openai = this.openaiService.getClient(apiKey);
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODELS.MEMORY,
        messages: [
          {
            role: 'system',
            content: OPENAI_PROMPTS.MEMORY.SUMMARY.SYSTEM,
          },
          {
            role: 'user',
            content: OPENAI_PROMPTS.MEMORY.SUMMARY.USER(memoriesText),
          },
        ],
        temperature: NUMERIC_CONSTANTS.TRANSLATION_TEMPERATURE,
        max_tokens: 300, // Enough for 5 sentences
      });

      const summary = completion.choices[0]?.message?.content?.trim();
      if (!summary) {
        this.logger.warn(
          `No summary generated for agent ${agentId}, user ${userId}`
        );
        return;
      }

      // Limit to reasonable length (5 sentences should be ~500 chars max)
      const trimmedSummary = summary.substring(0, 1000);

      // Update agent with summary
      await this.agentRepository.updateMemorySummary(agentId, trimmedSummary);

      this.logger.log(
        `Generated memory summary for agent ${agentId}, user ${userId}: ${trimmedSummary.substring(0, 50)}...`
      );
    } catch (error) {
      this.logger.error(
        `Error generating memory summary for agent ${agentId}, user ${userId}:`,
        error
      );
      // Don't throw - summary generation failure shouldn't break memory operations
    }
  }
}
