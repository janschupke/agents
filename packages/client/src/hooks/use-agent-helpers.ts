import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queries/query-keys';
import { Agent, Session } from '../types/chat.types';

/**
 * Helper hooks for agent operations using React Query cache
 * These replace the AgentContext functionality
 */

/**
 * Get an agent by ID from React Query cache
 */
export function useGetAgent() {
  const queryClient = useQueryClient();

  return (agentId: number): Agent | undefined => {
    return queryClient.getQueryData<Agent>(queryKeys.agents.detail(agentId));
  };
}

/**
 * Get agent sessions from React Query cache
 */
export function useGetAgentSessions() {
  const queryClient = useQueryClient();

  return (agentId: number): Session[] | undefined => {
    return queryClient.getQueryData<Session[]>(
      queryKeys.agents.sessions(agentId)
    );
  };
}

/**
 * Helper to invalidate agent-related queries
 */
export function useInvalidateAgent() {
  const queryClient = useQueryClient();

  return {
    invalidateAgent: (agentId: number) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.detail(agentId),
      });
    },
    invalidateAgentList: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.all });
    },
    invalidateAgentSessions: (agentId: number) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.sessions(agentId),
      });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.all });
    },
  };
}

/**
 * Helper to optimistically update agent in cache
 */
export function useUpdateAgentCache() {
  const queryClient = useQueryClient();

  return (agent: Agent) => {
    queryClient.setQueryData(queryKeys.agents.detail(agent.id), agent);
    queryClient.invalidateQueries({ queryKey: queryKeys.agents.all });
  };
}

/**
 * Helper to optimistically update agent sessions in cache
 */
export function useUpdateAgentSessionsCache() {
  const queryClient = useQueryClient();

  return {
    addSession: (agentId: number, session: Session) => {
      const currentSessions =
        queryClient.getQueryData<Session[]>(
          queryKeys.agents.sessions(agentId)
        ) || [];
      queryClient.setQueryData(queryKeys.agents.sessions(agentId), [
        session,
        ...currentSessions,
      ]);
    },
    removeSession: (agentId: number, sessionId: number) => {
      const currentSessions =
        queryClient.getQueryData<Session[]>(
          queryKeys.agents.sessions(agentId)
        ) || [];
      queryClient.setQueryData(
        queryKeys.agents.sessions(agentId),
        currentSessions.filter((s) => s.id !== sessionId)
      );
    },
  };
}
