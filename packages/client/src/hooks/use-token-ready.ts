import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tokenProvider } from '../services/token-provider';

/**
 * Hook that returns whether the token provider is ready for API requests
 * This prevents race conditions where queries run before authentication is set up
 */
export function useTokenReady(): boolean {
  const { isSignedIn, isLoaded } = useAuth();
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      if (tokenProvider.isReady()) {
        setTokenReady(true);
      } else {
        // Wait for token provider to be ready
        tokenProvider.waitForReady().then(() => {
          setTokenReady(true);
        });
      }
    } else {
      setTokenReady(false);
    }
  }, [isSignedIn, isLoaded]);

  return tokenReady;
}

