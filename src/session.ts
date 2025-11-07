import { createSupabaseClient } from './clients.js';

export interface ChatSession {
  id: number;
  bot_id: number;
  session_name: string | null;
  created_at: string;
}

/**
 * Create a new chat session
 */
export async function createSession(
  botId: number,
  sessionName?: string
): Promise<ChatSession> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      bot_id: botId,
      session_name: sessionName || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ChatSession;
}

/**
 * Load a session by ID
 */
export async function loadSession(
  sessionId: number
): Promise<ChatSession | null> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as ChatSession;
}

/**
 * Load the most recent session for a bot
 */
export async function loadLatestSession(
  botId: number
): Promise<ChatSession | null> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('bot_id', botId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as ChatSession;
}

/**
 * List all sessions for a bot
 */
export async function listSessions(botId: number): Promise<ChatSession[]> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('bot_id', botId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as ChatSession[];
}
