import { createSupabaseClient } from './clients.js';
import { createOpenAIClient } from './clients.js';

export interface MemoryChunk {
  id: number;
  session_id: number;
  chunk: string;
  vector: number[] | null;
  created_at: string;
}

/**
 * Generate embedding vector for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = createOpenAIClient();

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // OpenAI's embedding model
      input: text,
    });

    if (response.data && response.data.length > 0) {
      return response.data[0].embedding;
    }

    throw new Error('No embedding returned from OpenAI');
  } catch (error) {
    const err = error as { message?: string };
    throw new Error(
      `Failed to generate embedding: ${err.message || 'Unknown error'}`
    );
  }
}

/**
 * Save a memory chunk with vector embedding
 * If vector is not provided, generates one using OpenAI
 */
export async function saveMemoryChunk(
  sessionId: number,
  chunk: string,
  vector?: number[]
): Promise<MemoryChunk> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // Generate embedding if not provided
  let embedding: number[] | null = vector || null;
  if (!embedding) {
    try {
      embedding = await generateEmbedding(chunk);
    } catch (error) {
      const err = error as { message?: string };
      console.warn(
        `Warning: Failed to generate embedding: ${err.message || 'Unknown error'}`
      );
      // Continue without embedding if generation fails
      embedding = null;
    }
  }

  // Insert with both vector (for compatibility) and vector_embedding (for pgvector)
  const insertData: {
    session_id: number;
    chunk: string;
    vector: number[] | null;
    vector_embedding?: string; // pgvector format: [1,2,3,...]
  } = {
    session_id: sessionId,
    chunk,
    vector: embedding,
  };

  // Add vector_embedding in pgvector format if embedding exists
  if (embedding) {
    insertData.vector_embedding = `[${embedding.join(',')}]`;
  }

  const { data, error } = await supabase
    .from('memory_chunks')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as MemoryChunk;
}

/**
 * Load memory chunks for a session
 */
export async function loadMemoryChunks(
  sessionId: number,
  limit?: number
): Promise<MemoryChunk[]> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  let query = supabase
    .from('memory_chunks')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as MemoryChunk[];
}

/**
 * Load memory chunks for all sessions of a bot
 * Useful for cross-session memory retrieval
 */
export async function loadMemoryChunksForBot(
  botId: number,
  limit?: number
): Promise<MemoryChunk[]> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // First get all sessions for this bot
  const { data: sessions, error: sessionsError } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('bot_id', botId);

  if (sessionsError) {
    throw sessionsError;
  }

  if (!sessions || sessions.length === 0) {
    return [];
  }

  const sessionIds = sessions.map((s) => s.id);

  // Load memory chunks for all sessions
  let query = supabase
    .from('memory_chunks')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as MemoryChunk[];
}

/**
 * Find similar memory chunks using pgvector (if available) or fallback to in-memory search
 * Uses Supabase RPC function for efficient vector similarity search
 */
export async function findSimilarMemories(
  queryVector: number[],
  sessionIds?: number[],
  topK: number = 5,
  threshold: number = 0.7
): Promise<MemoryChunk[]> {
  if (!queryVector || queryVector.length === 0) {
    return [];
  }

  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // Try pgvector search first (if extension is enabled)
  try {
    // Format vector for pgvector - pass as array, Supabase will convert to vector type
    // The RPC function expects vector(1536), which Supabase converts from array
    const vectorArray = queryVector;

    if (sessionIds && sessionIds.length > 0) {
      // Search within specific sessions
      // Note: Supabase RPC may need the vector as a string in format '[1,2,3,...]'
      // or as an array depending on how the function is defined
      const { data, error } = await supabase.rpc('find_similar_memories', {
        query_embedding: `[${vectorArray.join(',')}]`, // Pass as string format for pgvector
        session_ids: sessionIds,
        match_threshold: threshold,
        match_count: topK,
      });

      if (!error && data) {
        return data.map(
          (item: { id: number; session_id: number; chunk: string }) => ({
            id: item.id,
            session_id: item.session_id,
            chunk: item.chunk,
            vector: queryVector, // Use query vector as reference
            created_at: new Date().toISOString(),
          })
        ) as MemoryChunk[];
      }
    } else {
      // If no session IDs provided, we can't use pgvector function
      // Fall through to in-memory search
    }
  } catch (error) {
    // pgvector not available or function doesn't exist, fall back to in-memory
    console.warn('pgvector search not available, using in-memory search');
  }

  // Fallback: Load all memories and search in-memory
  // This is less efficient but works without pgvector
  const allMemories: MemoryChunk[] = [];

  if (sessionIds && sessionIds.length > 0) {
    // Load memories for specified sessions
    for (const sid of sessionIds) {
      const memories = await loadMemoryChunks(sid);
      allMemories.push(...memories);
    }
  } else {
    // If no session IDs, we need memories passed in
    // This fallback requires memories to be provided
    return [];
  }

  // Calculate cosine similarity for each memory
  const scored = allMemories
    .filter((m) => m.vector && m.vector.length > 0)
    .map((memory) => {
      const similarity = cosineSimilarity(queryVector, memory.vector!);
      return { memory, similarity };
    })
    .filter((item) => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map((item) => item.memory);

  return scored;
}

/**
 * Find similar memories for a bot using pgvector (if available)
 */
export async function findSimilarMemoriesForBot(
  queryVector: number[],
  botId: number,
  topK: number = 5,
  threshold: number = 0.7
): Promise<MemoryChunk[]> {
  if (!queryVector || queryVector.length === 0) {
    return [];
  }

  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // Try pgvector search first
  try {
    const vectorString = `[${queryVector.join(',')}]`;

    const { data, error } = await supabase.rpc(
      'find_similar_memories_for_bot',
      {
        query_embedding: vectorString,
        bot_id_param: botId,
        match_threshold: threshold,
        match_count: topK,
      }
    );

    if (!error && data) {
      return data.map(
        (item: { id: number; session_id: number; chunk: string }) => ({
          id: item.id,
          session_id: item.session_id,
          chunk: item.chunk,
          vector: queryVector,
          created_at: new Date().toISOString(),
        })
      ) as MemoryChunk[];
    }
  } catch (error) {
    // pgvector not available, fall back to loading all memories
    console.warn('pgvector search not available, using in-memory search');
  }

  // Fallback: Load all memories for bot and search in-memory
  const allMemories = await loadMemoryChunksForBot(botId);

  const scored = allMemories
    .filter((m) => m.vector && m.vector.length > 0)
    .map((memory) => {
      const similarity = cosineSimilarity(queryVector, memory.vector!);
      return { memory, similarity };
    })
    .filter((item) => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map((item) => item.memory);

  return scored;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
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

/**
 * Create a memory chunk from conversation summary
 * This is a simple implementation - you could enhance it with AI summarization
 */
export function createMemoryChunkFromMessages(
  messages: Array<{ role: string; content: string }>
): string {
  // Simple implementation: combine recent messages into a summary
  // In a production system, you might use AI to create better summaries
  const recentMessages = messages.slice(-5); // Last 5 messages
  return recentMessages.map((msg) => `${msg.role}: ${msg.content}`).join('\n');
}
