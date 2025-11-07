import { createSupabaseClient } from './clients.js';

export interface MemoryChunk {
  id: number;
  session_id: number;
  chunk: string;
  vector: number[] | null;
  created_at: string;
}

/**
 * Save a memory chunk
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

  const { data, error } = await supabase
    .from('memory_chunks')
    .insert({
      session_id: sessionId,
      chunk,
      vector: vector || null,
    })
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
