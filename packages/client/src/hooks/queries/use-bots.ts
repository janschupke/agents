import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useTokenReady } from '../use-token-ready';
import { BotService } from '../../services/bot.service';
import { ChatService } from '../../services/chat.service';
import { MemoryService } from '../../services/memory.service';
import { Bot, Session, AgentMemory } from '../../types/chat.types';
import { queryKeys } from './query-keys';

export function useBots() {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<Bot[]>({
    queryKey: queryKeys.bots.list(),
    queryFn: () => BotService.getAllBots(),
    enabled: isSignedIn && isLoaded && tokenReady, // Only fetch when auth is ready and token provider is set up
  });
}

export function useBot(botId: number | null) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<Bot>({
    queryKey: queryKeys.bots.detail(botId!),
    queryFn: () => BotService.getBot(botId!),
    enabled: botId !== null && isSignedIn && isLoaded && tokenReady,
  });
}

export function useBotSessions(botId: number | null) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<Session[]>({
    queryKey: queryKeys.bots.sessions(botId!),
    queryFn: () => ChatService.getSessions(botId!),
    enabled: botId !== null && isSignedIn && isLoaded && tokenReady,
  });
}

export function useBotMemories(botId: number | null) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<AgentMemory[]>({
    queryKey: queryKeys.bots.memories(botId!),
    queryFn: () => MemoryService.getMemories(botId!),
    enabled: botId !== null && isSignedIn && isLoaded && tokenReady,
  });
}
