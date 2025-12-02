import { useQuery } from '@tanstack/react-query';
import { UserService } from '../../services/user.service';
import { User } from '../../types/chat.types';
import { queryKeys } from './query-keys';

export function useUser() {
  return useQuery<User>({
    queryKey: queryKeys.user.me(),
    queryFn: () => UserService.getCurrentUser(),
  });
}

export function useApiKeyStatus() {
  return useQuery<{ hasApiKey: boolean }>({
    queryKey: queryKeys.user.apiKey(),
    queryFn: async () => {
      // This would need to be implemented based on your API
      // For now, returning a placeholder
      try {
        await UserService.getCurrentUser();
        return { hasApiKey: true };
      } catch {
        return { hasApiKey: false };
      }
    },
  });
}

