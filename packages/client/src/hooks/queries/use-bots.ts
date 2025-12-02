import { useQuery } from '@tanstack/react-query';
import { BotService } from '../../services/bot.service.js';
import { ChatService } from '../../services/chat.service.js';
import { MemoryService } from '../../services/memory.service.js';
import { Bot, Session, AgentMemory } from '../../types/chat.types.js';
import { queryKeys } from './query-keys.js';

export function useBots() {
  return useQuery<Bot[]>({
    queryKey: queryKeys.bots.list(),
    queryFn: () => BotService.getAllBots(),
  });
}

export function useBot(botId: number | null) {
  return useQuery<Bot>({
    queryKey: queryKeys.bots.detail(botId!),
    queryFn: () => BotService.getBot(botId!),
    enabled: botId !== null,
  });
}

export function useBotSessions(botId: number | null) {
  return useQuery<Session[]>({
    queryKey: queryKeys.bots.sessions(botId!),
    queryFn: () => ChatService.getSessions(botId!),
    enabled: botId !== null,
  });
}

export function useBotMemories(botId: number | null) {
  return useQuery<AgentMemory[]>({
    queryKey: queryKeys.bots.memories(botId!),
    queryFn: () => MemoryService.getMemories(botId!),
    enabled: botId !== null,
  });
}
