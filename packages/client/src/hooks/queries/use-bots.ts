import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useTokenReady } from '../use-token-ready';
import { AgentService } from '../../services/bot.service';
import { ChatService } from '../../services/chat.service';
import { MemoryService } from '../../services/memory.service';
import { Agent, Session, AgentMemory } from '../../types/chat.types';
import { queryKeys } from './query-keys';

export function useAgents() {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<Agent[]>({
    queryKey: queryKeys.agents.list(),
    queryFn: () => AgentService.getAllAgents(),
    enabled: isSignedIn && isLoaded && tokenReady, // Only fetch when auth is ready and token provider is set up
  });
}

export function useAgent(agentId: number | null) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<Agent>({
    queryKey: queryKeys.agents.detail(agentId!),
    queryFn: () => AgentService.getAgent(agentId!),
    enabled: agentId !== null && isSignedIn && isLoaded && tokenReady,
  });
}

export function useAgentSessions(agentId: number | null) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<Session[]>({
    queryKey: queryKeys.agents.sessions(agentId!),
    queryFn: () => ChatService.getSessions(agentId!),
    enabled: agentId !== null && isSignedIn && isLoaded && tokenReady,
  });
}

export function useAgentMemories(agentId: number | null) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<AgentMemory[]>({
    queryKey: queryKeys.agents.memories(agentId!),
    queryFn: () => MemoryService.getMemories(agentId!),
    enabled: agentId !== null && isSignedIn && isLoaded && tokenReady,
  });
}
