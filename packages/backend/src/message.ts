import { createSupabaseClient } from './clients.js';

export interface Message {
  id: number;
  session_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Save a message to the database
 */
export async function saveMessage(
  sessionId: number,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: Record<string, unknown>
): Promise<Message> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      metadata: metadata || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Message;
}

/**
 * Load messages for a session (most recent first)
 */
export async function loadMessages(
  sessionId: number,
  limit?: number
): Promise<Message[]> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  let query = supabase
    .from('messages')
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

  // Reverse to get chronological order (oldest first)
  return ((data || []) as Message[]).reverse();
}

/**
 * Load messages in OpenAI format (for API calls)
 */
export async function loadMessagesForOpenAI(
  sessionId: number,
  limit?: number
): Promise<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>> {
  const messages = await loadMessages(sessionId, limit);
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}
