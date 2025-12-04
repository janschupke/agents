import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentMemory } from '@prisma/client';
import { NUMERIC_CONSTANTS } from '../common/constants/numeric.constants.js';

interface AgentMemoryWithVector {
  id: number;
  agentId: number;
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
  private readonly logger = new Logger(AgentMemoryRepository.name);
  // Vector dimension constant for SQL queries (pgvector requires literal in type definition)
  private readonly VECTOR_DIMENSION = NUMERIC_CONSTANTS.EMBEDDING_DIMENSIONS;

  constructor(private readonly prisma: PrismaService) {}

  async create(
    agentId: number,
    userId: string,
    keyPoint: string,
    context: unknown,
    vector?: number[]
  ): Promise<AgentMemory> {
    if (!vector || vector.length === 0) {
      throw new BadRequestException(
        'Vector is required for agent memory creation'
      );
    }

    if (vector.length !== this.VECTOR_DIMENSION) {
      this.logger.warn(
        `Warning: Vector length is ${vector.length}, expected ${this.VECTOR_DIMENSION}. Attempting to proceed...`
      );
    }

    const vectorString = `[${vector.join(',')}]`;

    try {
      // Get current max update count and increment for new memory
      const currentCount = await this.getUpdateCount(agentId, userId);
      const newUpdateCount = currentCount + 1;

      const result = await this.prisma.$queryRawUnsafe<
        Array<{
          id: number;
          agent_id: number;
          user_id: string;
          key_point: string;
          context: unknown;
          vector_embedding: string | null;
          created_at: Date;
          updated_at: Date;
          update_count: number;
        }>
      >(
        `INSERT INTO agent_memories (agent_id, user_id, key_point, context, vector_embedding, update_count)
         VALUES ($1, $2, $3, $4::jsonb, $5::vector(${this.VECTOR_DIMENSION}), $6)
         RETURNING id, agent_id, user_id, key_point, context, vector_embedding, created_at, updated_at, update_count`,
        agentId,
        userId,
        keyPoint,
        JSON.stringify(context),
        vectorString,
        newUpdateCount
      );

      if (!result || result.length === 0) {
        throw new InternalServerErrorException(
          'Failed to create agent memory: no result returned'
        );
      }

      const created = result[0];
      this.logger.log(
        `Successfully created agent memory ${created.id} for agent ${agentId}, user ${userId}`
      );

      return {
        id: created.id,
        agentId: created.agent_id,
        userId: created.user_id,
        keyPoint: created.key_point,
        context: created.context,
        vectorEmbedding: null,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
        updateCount: created.update_count,
      } as AgentMemory;
    } catch (error) {
      this.logger.error('Error creating agent memory:', error);
      throw error;
    }
  }

  async findAllByAgentId(
    agentId: number,
    userId: string,
    limit?: number
  ): Promise<AgentMemoryWithVector[]> {
    this.logger.debug(
      `Finding memories for agent ${agentId}, user ${userId}, limit: ${limit || 'none'}`
    );

    // Build query with proper parameterization for LIMIT
    let query = `SELECT id, agent_id, user_id, key_point, context, vector_embedding, created_at, updated_at, update_count
       FROM agent_memories
       WHERE agent_id = $1 AND user_id = $2
       ORDER BY created_at DESC`;
    
    const params: unknown[] = [agentId, userId];
    
    if (limit && limit > 0) {
      query += ` LIMIT $3`;
      params.push(limit);
    }

    const chunks = await this.prisma.$queryRawUnsafe<
      Array<{
        id: number;
        agent_id: number;
        user_id: string;
        key_point: string;
        context: unknown;
        vector_embedding: string | null;
        created_at: Date;
        updated_at: Date;
        update_count: number;
      }>
    >(query, ...params);

    this.logger.debug(
      `Found ${chunks.length} memories for agent ${agentId}, user ${userId}`
    );

    return chunks.map((chunk) => ({
      id: chunk.id,
      agentId: chunk.agent_id,
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
    agentId: number,
    userId: string,
    topK: number = 5,
    threshold: number = 0.5
  ): Promise<AgentMemoryWithVector[]> {
    const vectorString = `[${queryVector.join(',')}]`;

    try {
      const results = await this.prisma.$queryRawUnsafe<
        Array<{
          id: number;
          agent_id: number;
          user_id: string;
          key_point: string;
          context: unknown;
          similarity: number;
          created_at: Date;
          updated_at: Date;
          update_count: number;
        }>
      >(
        `SELECT id, agent_id, user_id, key_point, context,
         1 - (vector_embedding <=> $1::vector(${this.VECTOR_DIMENSION})) as similarity,
         created_at, updated_at, update_count
         FROM agent_memories
         WHERE agent_id = $2 AND user_id = $3
         AND vector_embedding IS NOT NULL
         AND 1 - (vector_embedding <=> $1::vector(${this.VECTOR_DIMENSION})) >= $4
         ORDER BY vector_embedding <=> $1::vector(${this.VECTOR_DIMENSION})
         LIMIT $5`,
        vectorString,
        agentId,
        userId,
        threshold,
        topK
      );

      if (results && results.length > 0) {
        this.logger.log(
          `Found ${results.length} similar memories for agent ${agentId}, user ${userId}`
        );
        return results.map((r) => ({
          id: r.id,
          agentId: r.agent_id,
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
      this.logger.error('Error finding similar memories:', error);
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

  async countByAgentId(agentId: number, userId: string): Promise<number> {
    return this.prisma.agentMemory.count({
      where: {
        agentId,
        userId,
      },
    });
  }

  async findForSummarization(
    agentId: number,
    userId: string,
    limit: number = 100
  ): Promise<AgentMemoryWithVector[]> {
    return this.findAllByAgentId(agentId, userId, limit);
  }

  async incrementUpdateCount(agentId: number, userId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE agent_memories 
       SET update_count = update_count + 1
       WHERE agent_id = $1 AND user_id = $2`,
      agentId,
      userId
    );
  }

  async resetUpdateCount(agentId: number, userId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE agent_memories 
       SET update_count = 0
       WHERE agent_id = $1 AND user_id = $2`,
      agentId,
      userId
    );
  }

  async getUpdateCount(agentId: number, userId: string): Promise<number> {
    const result = await this.prisma.$queryRawUnsafe<
      Array<{ update_count: number }>
    >(
      `SELECT MAX(update_count) as update_count
       FROM agent_memories
       WHERE agent_id = $1 AND user_id = $2`,
      agentId,
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

  private parseVector(vector: string | null | unknown): number[] | null {
    if (!vector) return null;
    if (typeof vector === 'string') {
      try {
        // pgvector returns as string like '[0.1,0.2,0.3]'
        const cleaned = vector.replace(/[[\]]/g, '');
        return cleaned.split(',').map(Number);
      } catch {
        return null;
      }
    }
    return null;
  }
}
