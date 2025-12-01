import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentMemory } from '@prisma/client';

export interface AgentMemoryWithVector {
  id: number;
  botId: number;
  userId: string;
  keyPoint: string;
  context: unknown;
  vectorEmbedding: number[] | null;
  createdAt: Date;
  updatedAt: Date;
  updateCount: number;
}

@Injectable()
export class AgentMemoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    botId: number,
    userId: string,
    keyPoint: string,
    context: unknown,
    vector?: number[]
  ): Promise<AgentMemory> {
    if (!vector || vector.length === 0) {
      throw new Error('Vector is required for agent memory creation');
    }

    if (vector.length !== 1536) {
      console.warn(
        `Warning: Vector length is ${vector.length}, expected 1536. Attempting to proceed...`
      );
    }

    const vectorString = `[${vector.join(',')}]`;

    try {
      // Get current max update count and increment for new memory
      const currentCount = await this.getUpdateCount(botId, userId);
      const newUpdateCount = currentCount + 1;

      const result = await this.prisma.$queryRawUnsafe<
        Array<{
          id: number;
          bot_id: number;
          user_id: string;
          key_point: string;
          context: unknown;
          vector_embedding: string | null;
          created_at: Date;
          updated_at: Date;
          update_count: number;
        }>
      >(
        `INSERT INTO agent_memories (bot_id, user_id, key_point, context, vector_embedding, update_count)
         VALUES ($1, $2, $3, $4::jsonb, $5::vector(1536), $6)
         RETURNING id, bot_id, user_id, key_point, context, vector_embedding, created_at, updated_at, update_count`,
        botId,
        userId,
        keyPoint,
        JSON.stringify(context),
        vectorString,
        newUpdateCount
      );

      if (!result || result.length === 0) {
        throw new Error('Failed to create agent memory: no result returned');
      }

      const created = result[0];
      console.log(
        `Successfully created agent memory ${created.id} for bot ${botId}, user ${userId}`
      );

      return {
        id: created.id,
        botId: created.bot_id,
        userId: created.user_id,
        keyPoint: created.key_point,
        context: created.context,
        vectorEmbedding: null,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
        updateCount: created.update_count,
      } as AgentMemory;
    } catch (error) {
      console.error('Error creating agent memory:', error);
      throw error;
    }
  }

  async findAllByBotId(
    botId: number,
    userId: string,
    limit?: number
  ): Promise<AgentMemoryWithVector[]> {
    const chunks = await this.prisma.$queryRawUnsafe<
      Array<{
        id: number;
        bot_id: number;
        user_id: string;
        key_point: string;
        context: unknown;
        vector_embedding: string | null;
        created_at: Date;
        updated_at: Date;
        update_count: number;
      }>
    >(
      `SELECT id, bot_id, user_id, key_point, context, vector_embedding, created_at, updated_at, update_count
       FROM agent_memories
       WHERE bot_id = $1 AND user_id = $2
       ORDER BY created_at DESC
       ${limit ? `LIMIT ${limit}` : ''}`,
      botId,
      userId
    );

    return chunks.map((chunk) => ({
      id: chunk.id,
      botId: chunk.bot_id,
      userId: chunk.user_id,
      keyPoint: chunk.key_point,
      context: chunk.context,
      vectorEmbedding: this.parseVector(chunk.vector_embedding),
      createdAt: chunk.created_at,
      updatedAt: chunk.updated_at,
      updateCount: chunk.update_count,
    }));
  }

  async findSimilar(
    queryVector: number[],
    botId: number,
    userId: string,
    topK: number = 5,
    threshold: number = 0.5
  ): Promise<AgentMemoryWithVector[]> {
    const vectorString = `[${queryVector.join(',')}]`;

    try {
      const results = await this.prisma.$queryRawUnsafe<
        Array<{
          id: number;
          bot_id: number;
          user_id: string;
          key_point: string;
          context: unknown;
          similarity: number;
          created_at: Date;
          updated_at: Date;
          update_count: number;
        }>
      >(
        `SELECT id, bot_id, user_id, key_point, context,
         1 - (vector_embedding <=> $1::vector(1536)) as similarity,
         created_at, updated_at, update_count
         FROM agent_memories
         WHERE bot_id = $2 AND user_id = $3
         AND vector_embedding IS NOT NULL
         AND 1 - (vector_embedding <=> $1::vector(1536)) >= $4
         ORDER BY vector_embedding <=> $1::vector(1536)
         LIMIT $5`,
        vectorString,
        botId,
        userId,
        threshold,
        topK
      );

      if (results && results.length > 0) {
        console.log(
          `Found ${results.length} similar memories for bot ${botId}, user ${userId}`
        );
        return results.map((r) => ({
          id: r.id,
          botId: r.bot_id,
          userId: r.user_id,
          keyPoint: r.key_point,
          context: r.context,
          vectorEmbedding: queryVector,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          updateCount: r.update_count,
        }));
      }

      return [];
    } catch (error) {
      console.error('Error finding similar memories:', error);
      return [];
    }
  }

  async update(id: number, keyPoint: string): Promise<AgentMemory> {
    return this.prisma.agentMemory.update({
      where: { id },
      data: { keyPoint },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.agentMemory.delete({
      where: { id },
    });
  }

  async countByBotId(botId: number, userId: string): Promise<number> {
    return this.prisma.agentMemory.count({
      where: {
        botId,
        userId,
      },
    });
  }

  async findForSummarization(
    botId: number,
    userId: string,
    limit: number = 100
  ): Promise<AgentMemoryWithVector[]> {
    return this.findAllByBotId(botId, userId, limit);
  }

  async incrementUpdateCount(botId: number, userId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE agent_memories 
       SET update_count = update_count + 1
       WHERE bot_id = $1 AND user_id = $2`,
      botId,
      userId
    );
  }

  async resetUpdateCount(botId: number, userId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE agent_memories 
       SET update_count = 0
       WHERE bot_id = $1 AND user_id = $2`,
      botId,
      userId
    );
  }

  async getUpdateCount(botId: number, userId: string): Promise<number> {
    const result = await this.prisma.$queryRawUnsafe<
      Array<{ update_count: number }>
    >(
      `SELECT MAX(update_count) as update_count
       FROM agent_memories
       WHERE bot_id = $1 AND user_id = $2`,
      botId,
      userId
    );

    return result[0]?.update_count || 0;
  }

  async deleteMany(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.agentMemory.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }

  private parseVector(
    vector: string | null | unknown
  ): number[] | null {
    if (!vector) return null;
    if (typeof vector === 'string') {
      try {
        // pgvector returns as string like '[0.1,0.2,0.3]'
        const cleaned = vector.replace(/[\[\]]/g, '');
        return cleaned.split(',').map(Number);
      } catch {
        return null;
      }
    }
    return null;
  }
}
