import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useTokenReady } from '../utils/use-token-ready';
import { UserService } from '../../services/user/user.service';
import { ApiCredentialsService } from '../../services/user/api-credentials.service';
import { User } from '../../types/chat.types';
import { queryKeys } from './query-keys';
import { USER_STALE_TIME } from '../../constants/cache.constants';

export function useUser() {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<User>({
    queryKey: queryKeys.user.me(),
    queryFn: () => UserService.getCurrentUser(),
    enabled: isSignedIn && isLoaded && tokenReady, // Only fetch when auth is ready and token provider is set up
  });
}

export function useApiKeyStatus() {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  return useQuery<{ hasApiKey: boolean }>({
    queryKey: queryKeys.user.apiKey(),
    queryFn: async () => {
      const hasKey = await ApiCredentialsService.hasOpenAIKey();
      return { hasApiKey: hasKey };
    },
    enabled: isSignedIn && isLoaded && tokenReady, // Only fetch when auth is ready and token provider is set up
    staleTime: USER_STALE_TIME,
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce calls
  });
}
