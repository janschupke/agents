import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
    // For vector operations, we need to use raw SQL since Prisma doesn't fully support pgvector
    const vectorJson = vector ? JSON.stringify(vector) : null;
    const vectorEmbedding = vector ? `[${vector.join(',')}]` : null;

    // Use raw SQL for pgvector support
    const result = await this.prisma.$queryRawUnsafe<MemoryChunk[]>(
      `INSERT INTO memory_chunks (session_id, chunk, vector, vector_embedding)
       VALUES ($1, $2, $3::real[], $4::vector(1536))
       RETURNING *`,
      sessionId,
      chunk,
      vectorJson,
      vectorEmbedding
    );

    return result[0];
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

  async findSimilarForBot(
    queryVector: number[],
    botId: number,
    topK: number = 5,
    threshold: number = 0.7
  ): Promise<MemoryChunkWithVector[]> {
    const vectorString = `[${queryVector.join(',')}]`;

    try {
      // Try using the pgvector function via raw SQL
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
           SELECT id FROM chat_sessions WHERE bot_id = $2
         )
         AND vector_embedding IS NOT NULL
         AND 1 - (vector_embedding <=> $1::vector(1536)) >= $3
         ORDER BY vector_embedding <=> $1::vector(1536)
         LIMIT $4`,
        vectorString,
        botId,
        threshold,
        topK
      );

      return results.map((r) => ({
        id: r.id,
        sessionId: r.session_id,
        chunk: r.chunk,
        vector: queryVector,
        createdAt: new Date(),
      }));
    } catch (error) {
      // Fallback to in-memory search if pgvector is not available
      console.warn('pgvector search not available, using in-memory search');
      const allMemories = await this.findAllByBotId(botId, 100);
      return this.findSimilarInMemory(queryVector, allMemories, topK, threshold);
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
