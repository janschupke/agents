import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { tokenProvider } from '../services/token-provider.js';

/**
 * Component that sets up token provider for API requests
 * This should be rendered inside ClerkProvider
 */
export default function ClerkTokenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      // Set up token getter
      // getToken() returns a JWT that can be verified by the API
      tokenProvider.setTokenGetter(async () => {
        try {
          // Get JWT token (default template)
          const token = await getToken();
          return token;
        } catch (error) {
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
