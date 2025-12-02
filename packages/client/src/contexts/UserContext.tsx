import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useUser as useUserQuery } from '../hooks/queries/use-user.js';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../hooks/queries/query-keys.js';
import { ApiCredentialsService } from '../services/api-credentials.service.js';
import { User } from '../types/chat.types.js';

interface UserContextValue {
  // User data
  userInfo: User | null;
  loadingUser: boolean;
  refreshUser: () => Promise<void>;

  // API Key status
  hasApiKey: boolean | null;
  loadingApiKey: boolean;
  refreshApiKey: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: userInfo, isLoading: loadingUser, refetch: refetchUser } = useUserQuery();
  const queryClient = useQueryClient();
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [loadingApiKey, setLoadingApiKey] = useState(false);

  const refreshUser = async () => {
    await refetchUser();
  };

  const refreshApiKey = async () => {
    setLoadingApiKey(true);
    try {
      const hasKey = await ApiCredentialsService.hasOpenAIKey();
      setHasApiKey(hasKey);
      queryClient.invalidateQueries({ queryKey: queryKeys.user.apiKey() });
    } catch (error) {
      console.error('Failed to load API key status:', error);
      setHasApiKey(false);
    } finally {
      setLoadingApiKey(false);
    }
  };

  // Load API key status on mount
  useEffect(() => {
    refreshApiKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: UserContextValue = {
    userInfo: userInfo || null,
    loadingUser,
    refreshUser,
    hasApiKey,
    loadingApiKey,
    refreshApiKey,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

// Convenience hooks
export function useUserInfo() {
  const { userInfo, loadingUser, refreshUser } = useUserContext();
  return { userInfo, loadingUser, refreshUser };
}

export function useApiKeyStatus() {
  const { hasApiKey, loadingApiKey, refreshApiKey } = useUserContext();
  return { hasApiKey, loadingApiKey, refreshApiKey };
}
