import { createSupabaseClient } from './clients.js';

export interface Bot {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface BotConfig {
  id: number;
  bot_id: number;
  config_key: string;
  config_value: unknown;
  created_at: string;
}

export interface BotWithConfig extends Bot {
  config: Record<string, unknown>;
}

/**
 * Load a bot by ID
 */
export async function loadBot(botId: number): Promise<Bot | null> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('bots')
    .select('*')
    .eq('id', botId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as Bot;
}

/**
 * Load a bot by name (returns first match)
 */
export async function loadBotByName(name: string): Promise<Bot | null> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('bots')
    .select('*')
    .eq('name', name)
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as Bot;
}

/**
 * Load all configs for a bot
 */
export async function loadBotConfigs(
  botId: number
): Promise<Record<string, unknown>> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('bot_configs')
    .select('*')
    .eq('bot_id', botId);

  if (error) {
    throw error;
  }

  const config: Record<string, unknown> = {};
  if (data) {
    for (const item of data as BotConfig[]) {
      config[item.config_key] = item.config_value;
    }
  }

  return config;
}

/**
 * Load bot with all its configs
 */
export async function loadBotWithConfig(
  botId: number
): Promise<BotWithConfig | null> {
  const bot = await loadBot(botId);
  if (!bot) {
    return null;
  }

  const config = await loadBotConfigs(botId);

  return {
    ...bot,
    config,
  };
}

/**
 * Load bot by name with all its configs
 */
export async function loadBotByNameWithConfig(
  name: string
): Promise<BotWithConfig | null> {
  const bot = await loadBotByName(name);
  if (!bot) {
    return null;
  }

  const config = await loadBotConfigs(bot.id);

  return {
    ...bot,
    config,
  };
}

/**
 * Get default bot config values
 */
export function getDefaultBotConfig(): Record<string, unknown> {
  return {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 1000,
    system_prompt: 'You are a helpful assistant.',
  };
}

/**
 * Merge bot config with defaults
 */
export function mergeBotConfig(
  botConfig: Record<string, unknown>
): Record<string, unknown> {
  const defaults = getDefaultBotConfig();
  return { ...defaults, ...botConfig };
}
