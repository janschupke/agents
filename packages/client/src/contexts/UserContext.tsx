import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types/chat.types';
import { UserService } from '../services/user.service';
import { ApiCredentialsService } from '../services/api-credentials.service';
import { useAuth } from './AuthContext';

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
  const { isSignedIn, isLoaded } = useAuth();
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [loadingApiKey, setLoadingApiKey] = useState(false);

  const loadUserInfo = useCallback(async () => {
    if (!isSignedIn || !isLoaded) {
      setUserInfo(null);
      return;
    }

    setLoadingUser(true);
    try {
      const user = await UserService.getCurrentUser();
      setUserInfo(user);
    } catch (error: unknown) {
      // Silently fail if it's an expected auth error (no token yet)
      if (error && typeof error === 'object' && 'expected' in error && !error.expected) {
        console.error('Failed to load user info:', error);
      }
      setUserInfo(null);
    } finally {
      setLoadingUser(false);
    }
  }, [isSignedIn, isLoaded]);

  const loadApiKeyStatus = useCallback(async () => {
    if (!isSignedIn || !isLoaded) {
      setHasApiKey(null);
      return;
    }

    setLoadingApiKey(true);
    try {
      const hasKey = await ApiCredentialsService.hasOpenAIKey();
      setHasApiKey(hasKey);
    } catch (error: unknown) {
      const apiError = error as { expected?: boolean; message?: string };
      if (!apiError.expected) {
        console.error('Failed to load API key status:', error);
      }
      setHasApiKey(false);
    } finally {
      setLoadingApiKey(false);
    }
  }, [isSignedIn, isLoaded]);

  const refreshUser = useCallback(async () => {
    await loadUserInfo();
  }, [loadUserInfo]);

  const refreshApiKey = useCallback(async () => {
    await loadApiKeyStatus();
  }, [loadApiKeyStatus]);

  // Load user info and API key status when signed in
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      // Only load if we don't already have user info
      if (!userInfo) {
        const timer = setTimeout(() => {
          loadUserInfo();
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      setUserInfo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isLoaded]); // Intentionally exclude loadUserInfo and userInfo to prevent re-fetching

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      // Only load if we don't already have API key status
      if (hasApiKey === null) {
        const timer = setTimeout(() => {
          loadApiKeyStatus();
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      setHasApiKey(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isLoaded]); // Intentionally exclude loadApiKeyStatus and hasApiKey to prevent re-fetching

  // Listen for API key save/delete events to refresh cache
  useEffect(() => {
    if (!isSignedIn || !isLoaded) return;

    const handleApiKeySaved = () => {
      loadApiKeyStatus();
    };

    window.addEventListener('apiKeySaved', handleApiKeySaved);
    return () => {
      window.removeEventListener('apiKeySaved', handleApiKeySaved);
    };
  }, [isSignedIn, isLoaded, loadApiKeyStatus]);

  const value: UserContextValue = {
    userInfo,
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
