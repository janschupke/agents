import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { useTokenReady } from '../use-token-ready';
import { systemConfigService } from '../../services/system-config.service';
import { queryKeys } from './query-keys';

interface SystemBehaviorRules {
  rules: string[];
}

export function useSystemRules() {
  const { isSignedIn, isLoaded } = useUser();
  const tokenReady = useTokenReady();

  return useQuery<SystemBehaviorRules>({
    queryKey: queryKeys.system.behaviorRules(),
    queryFn: () => systemConfigService.getBehaviorRules(),
    enabled: isSignedIn && isLoaded && tokenReady,
    retry: (failureCount, error) => {
      // Don't retry on 404 (no rules set yet)
      const err = error as { status?: number };
      if (err?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useUpdateSystemRules() {
  const queryClient = useQueryClient();

  return useMutation<SystemBehaviorRules, Error, string[]>({
    mutationFn: (rules: string[]) =>
      systemConfigService.updateBehaviorRules(rules),
    onSuccess: (data) => {
      // Update the cache with the new rules
      queryClient.setQueryData<SystemBehaviorRules>(
        queryKeys.system.behaviorRules(),
        data
      );
    },
  });
}
