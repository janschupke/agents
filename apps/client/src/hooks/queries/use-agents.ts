import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useTokenReady } from '../utils/use-token-ready';
import { AgentService } from '../../services/agent/agent.service';
import { SessionService } from '../../services/chat/session/session.service';
import { MemoryService } from '../../services/memory/memory.service';
import { Agent, Session, AgentMemory } from '../../types/chat.types';
import { queryKeys } from './query-keys';
import {
  AGENTS_STALE_TIME,
  SESSIONS_STALE_TIME,
} from '../../constants/cache.constants';

export function useAgents() {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<Agent[]>({
    queryKey: queryKeys.agents.list(),
    queryFn: () => AgentService.getAllAgents(),
    enabled: isSignedIn && isLoaded && tokenReady, // Only fetch when auth is ready and token provider is set up
    staleTime: AGENTS_STALE_TIME,
  });
}

export function useAgent(agentId: number | null) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  // Don't fetch if agentId is null or negative (temporary/unsaved agent)
  const isValidAgentId = agentId !== null && agentId > 0;

  return useQuery<Agent>({
    queryKey: queryKeys.agents.detail(agentId!),
    queryFn: () => AgentService.getAgent(agentId!),
    enabled: isValidAgentId && isSignedIn && isLoaded && tokenReady,
  });
}

export function useAgentSessions(agentId: number | null) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  // Don't fetch if agentId is null or negative (temporary/unsaved agent)
  const isValidAgentId = agentId !== null && agentId > 0;

  return useQuery<Session[]>({
    queryKey: queryKeys.agents.sessions(agentId!),
    queryFn: () => SessionService.getSessions(agentId!),
    enabled: isValidAgentId && isSignedIn && isLoaded && tokenReady,
    staleTime: SESSIONS_STALE_TIME,
  });
}

export function useAgentMemories(agentId: number | null) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  // Don't fetch if agentId is null or negative (temporary/unsaved agent)
  const isValidAgentId = agentId !== null && agentId > 0;

  return useQuery<AgentMemory[]>({
    queryKey: queryKeys.agents.memories(agentId!),
    queryFn: () => MemoryService.getMemories(agentId!),
    enabled: isValidAgentId && isSignedIn && isLoaded && tokenReady,
  });
}
