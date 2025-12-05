import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { HTTP_STATUS } from '@openai/shared-types';
import { useTokenReady } from '../../../hooks/use-token-ready';
import { systemConfigService } from '../../../services/system-config.service';
import { queryKeys } from '../../../hooks/queries/query-keys';
import { AgentType } from '../../../types/agent.types';

interface SystemBehaviorRules {
  rules: string[];
  system_prompt?: string;
}

interface UpdateSystemRulesParams {
  rules: string[];
  systemPrompt?: string;
  agentType?: AgentType | null;
}

export function useSystemRules(agentType: AgentType | null = null) {
  const { isSignedIn, isLoaded } = useUser();
  const tokenReady = useTokenReady();

  return useQuery({
    queryKey: queryKeys.system.behaviorRules()(agentType),
    queryFn: async (): Promise<SystemBehaviorRules> => {
      try {
        return await systemConfigService.getBehaviorRules(agentType);
      } catch (error) {
        // Treat 404 as "no data" - return empty rules
        const err = error as { status?: number };
        if (err?.status === HTTP_STATUS.NOT_FOUND) {
          return { rules: [], system_prompt: undefined };
        }
        throw error;
      }
    },
    enabled: isSignedIn && isLoaded && tokenReady,
    retry: (failureCount, error) => {
      // Don't retry on 404 (no rules set yet)
      const err = error as { status?: number };
      if (err?.status === HTTP_STATUS.NOT_FOUND) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useUpdateSystemRules() {
  const queryClient = useQueryClient();

  return useMutation<SystemBehaviorRules, Error, UpdateSystemRulesParams>({
    mutationFn: ({ rules, systemPrompt, agentType }) =>
      systemConfigService.updateBehaviorRules(rules, systemPrompt, agentType),
    onSuccess: (_data, variables) => {
      // Invalidate and refetch to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.system.behaviorRules()(variables.agentType ?? null),
      });
    },
  });
}
