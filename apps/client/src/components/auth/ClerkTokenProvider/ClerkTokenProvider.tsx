import { useLayoutEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { tokenProvider } from '../../../services/api/token-provider';

/**
 * Component that sets up token provider for API requests
 * This should be rendered inside ClerkProvider
 *
 * Uses useLayoutEffect to set up the token getter synchronously before
 * other components' effects run, preventing race conditions where API
 * calls happen before the token getter is configured.
 */
export default function ClerkTokenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getToken, isSignedIn } = useAuth();

  // Use useLayoutEffect to ensure token getter is set up synchronously
  // before other effects run, preventing race conditions
  useLayoutEffect(() => {
    if (isSignedIn) {
      // Set up token getter
      // getToken() returns a JWT that can be verified by the API
      tokenProvider.setTokenGetter(async () => {
        try {
          // Get JWT token (default template)
          const token = await getToken();
          if (!token) {
            console.warn('[ClerkTokenProvider] getToken() returned null');
          }
          return token;
        } catch (error) {
          console.error('[ClerkTokenProvider] Error getting token:', error);
          return null;
        }
      });
    } else {
      // Clear token when signed out
      tokenProvider.clearTokenGetter();
    }
  }, [getToken, isSignedIn]);

  return <>{children}</>;
}
