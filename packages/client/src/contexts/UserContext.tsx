import { createContext, useContext, ReactNode } from 'react';
import { useUser as useUserQuery, useApiKeyStatus as useApiKeyStatusQuery } from '../hooks/queries/use-user';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../hooks/queries/query-keys';
import { User } from '../types/chat.types';

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
  const { data: apiKeyData, isLoading: loadingApiKey, refetch: refetchApiKey } = useApiKeyStatusQuery();
  const queryClient = useQueryClient();

  const refreshUser = async () => {
    await refetchUser();
  };

  const refreshApiKey = async () => {
    await refetchApiKey();
    // Invalidate to ensure fresh data
    queryClient.invalidateQueries({ queryKey: queryKeys.user.apiKey() });
  };

  const value: UserContextValue = {
    userInfo: userInfo || null,
    loadingUser,
    refreshUser,
    hasApiKey: apiKeyData?.hasApiKey ?? null,
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
