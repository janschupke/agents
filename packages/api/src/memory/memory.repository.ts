import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryChunk, Prisma } from '@prisma/client';

export interface MemoryChunkWithVector {
  id: number;
  sessionId: number;
  chunk: string;
  vector: number[] | null;
  createdAt: Date;
}

@Injectable()
export class MemoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    sessionId: number,
    chunk: string,
    vector?: number[]
  ): Promise<MemoryChunk> {
    if (!vector || vector.length === 0) {
      throw new Error('Vector is required for memory chunk creation');
    }

    if (vector.length !== 1536) {
      console.warn(`Warning: Vector length is ${vector.length}, expected 1536. Attempting to proceed...`);
      // Don't throw, but log a warning - some embedding models might return different dimensions
    }

    // Format vector for PostgreSQL vector type: '[0.1,0.2,0.3]'
    const vectorString = `[${vector.join(',')}]`;
    // Format vector for REAL[] type (backup) - PostgreSQL expects array format
    const vectorArray = vector;

    try {
      // Use raw SQL for pgvector support
      // Note: We need to properly escape and format the vector string
      const result = await this.prisma.$queryRawUnsafe<Array<{
        id: number;
        session_id: number;
        chunk: string;
        vector: any;
        vector_embedding: any;
        created_at: Date;
      }>>(
        `INSERT INTO memory_chunks (session_id, chunk, vector, vector_embedding)
         VALUES ($1, $2, $3::real[], $4::vector(1536))
         RETURNING id, session_id, chunk, vector, vector_embedding, created_at`,
        sessionId,
        chunk,
        vectorArray,
        vectorString
      );

      if (!result || result.length === 0) {
        throw new Error('Failed to create memory chunk: no result returned');
      }

      const created = result[0];
      console.log(`Successfully created memory chunk ${created.id} for session ${sessionId}`);

      // Return in Prisma MemoryChunk format
      return {
        id: created.id,
        sessionId: created.session_id,
        chunk: created.chunk,
        vector: vectorArray as any, // Prisma Unsupported type
        vectorEmbedding: null as any, // Prisma Unsupported type - will be stored in DB
        createdAt: created.created_at,
      } as MemoryChunk;
    } catch (error) {
      console.error('Error creating memory chunk:', error);
      console.error('Session ID:', sessionId);
      console.error('Chunk length:', chunk.length);
      console.error('Chunk preview:', chunk.substring(0, 100));
      console.error('Vector length:', vector.length);
      console.error('Vector preview:', vector.slice(0, 5));
      throw error;
    }
  }

  async findAllBySessionId(
    sessionId: number,
    limit?: number
  ): Promise<MemoryChunkWithVector[]> {
    // Use raw query to get vector data since it's Unsupported type in Prisma
    const chunks = await this.prisma.$queryRawUnsafe<
      Array<{
        id: number;
        session_id: number;
        chunk: string;
        vector: any;
        created_at: Date;
      }>
    >(
      `SELECT id, session_id, chunk, vector, created_at
       FROM memory_chunks
       WHERE session_id = $1
       ORDER BY created_at DESC
       ${limit ? `LIMIT ${limit}` : ''}`,
      sessionId
    );

    // Convert vector from database format to number array
    return chunks.map((chunk) => ({
      id: chunk.id,
      sessionId: chunk.session_id,
      chunk: chunk.chunk,
      vector: this.parseVector(chunk.vector),
      createdAt: chunk.created_at,
    }));
  }

  async findAllByBotId(
    botId: number,
    limit?: number
  ): Promise<MemoryChunkWithVector[]> {
    // Use raw query to get vector data since it's Unsupported type in Prisma
    const chunks = await this.prisma.$queryRawUnsafe<
      Array<{
        id: number;
        session_id: number;
        chunk: string;
        vector: any;
        created_at: Date;
      }>
    >(
      `SELECT mc.id, mc.session_id, mc.chunk, mc.vector, mc.created_at
       FROM memory_chunks mc
       INNER JOIN chat_sessions cs ON mc.session_id = cs.id
       WHERE cs.bot_id = $1
       ORDER BY mc.created_at DESC
       ${limit ? `LIMIT ${limit}` : ''}`,
      botId
    );

    return chunks.map((chunk) => ({
      id: chunk.id,
      sessionId: chunk.session_id,
      chunk: chunk.chunk,
      vector: this.parseVector(chunk.vector),
      createdAt: chunk.created_at,
    }));
  }

  async findAllByBotIdAndUserId(
    botId: number,
    userId: string,
    limit?: number
  ): Promise<MemoryChunkWithVector[]> {
    // Use raw query to get vector data since it's Unsupported type in Prisma
    const chunks = await this.prisma.$queryRawUnsafe<
      Array<{
        id: number;
        session_id: number;
        chunk: string;
        vector: any;
        created_at: Date;
      }>
    >(
      `SELECT mc.id, mc.session_id, mc.chunk, mc.vector, mc.created_at
       FROM memory_chunks mc
       INNER JOIN chat_sessions cs ON mc.session_id = cs.id
       WHERE cs.bot_id = $1 AND cs.user_id = $2
       ORDER BY mc.created_at DESC
       ${limit ? `LIMIT ${limit}` : ''}`,
      botId,
      userId
    );

    return chunks.map((chunk) => ({
      id: chunk.id,
      sessionId: chunk.session_id,
      chunk: chunk.chunk,
      vector: this.parseVector(chunk.vector),
      createdAt: chunk.created_at,
    }));
  }

  async findSimilarForBot(
    queryVector: number[],
    botId: number,
    userId: string,
    topK: number = 5,
    threshold: number = 0.7
  ): Promise<MemoryChunkWithVector[]> {
    // Format vector for PostgreSQL vector type: '[0.1,0.2,0.3]'
    const vectorString = `[${queryVector.join(',')}]`;

    try {
      // Try using the pgvector function via raw SQL
      // Note: PostgreSQL vector type requires the format '[0.1,0.2,0.3]' as a string
      const results = await this.prisma.$queryRawUnsafe<
        Array<{
          id: number;
          session_id: number;
          chunk: string;
          similarity: number;
        }>
      >(
        `SELECT id, session_id, chunk, 
         1 - (vector_embedding <=> $1::vector(1536)) as similarity
         FROM memory_chunks
         WHERE session_id IN (
           SELECT id FROM chat_sessions WHERE bot_id = $2 AND user_id = $3
         )
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
        console.log(`Found ${results.length} similar memories for bot ${botId}, user ${userId}`);
        return results.map((r) => ({
          id: r.id,
          sessionId: r.session_id,
          chunk: r.chunk,
          vector: queryVector, // Use query vector as reference
          createdAt: new Date(),
        }));
      }
      
      return [];
    } catch (error) {
      // Fallback to in-memory search if pgvector is not available
      console.warn('pgvector search failed, using in-memory search:', error);
      try {
        const allMemories = await this.findAllByBotIdAndUserId(botId, userId, 100);
        return this.findSimilarInMemory(queryVector, allMemories, topK, threshold);
      } catch (fallbackError) {
        console.error('In-memory search also failed:', fallbackError);
        return [];
      }
    }
  }

  private findSimilarInMemory(
    queryVector: number[],
    memories: MemoryChunkWithVector[],
    topK: number,
    threshold: number
  ): MemoryChunkWithVector[] {
    const scored = memories
      .filter((m) => m.vector && m.vector.length > 0)
      .map((memory) => {
        const similarity = this.cosineSimilarity(queryVector, memory.vector!);
        return { memory, similarity };
      })
      .filter((item) => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map((item) => item.memory);

    return scored;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
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

  async deleteById(id: number): Promise<void> {
    await this.prisma.memoryChunk.delete({
      where: { id },
    });
  }

  private parseVector(vector: any): number[] | null {
    if (!vector) return null;
    if (Array.isArray(vector)) return vector;
    if (typeof vector === 'string') {
      try {
        return JSON.parse(vector);
      } catch {
        return null;
      }
    }
    return null;
  }
}
