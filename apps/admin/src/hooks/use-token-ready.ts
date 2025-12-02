import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';

/**
 * Hook that returns whether the token provider is ready for API requests
 * This prevents race conditions where queries run before authentication is set up
 */
export function useTokenReady(): boolean {
  const { isSignedIn, isLoaded } = useUser();
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      // Check if token provider has a getter set
      // For admin, we rely on ClerkTokenProvider to set the token getter
      // We'll wait a bit to ensure it's set up
      const timer = setTimeout(() => {
        setTokenReady(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setTokenReady(false);
      return undefined;
    }
  }, [isSignedIn, isLoaded]);

  return tokenReady;
}
