import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { tokenProvider } from '../services/token-provider.js';

export default function ClerkTokenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      tokenProvider.setTokenGetter(async () => {
        try {
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
      tokenProvider.clearTokenGetter();
    }
  }, [getToken, isSignedIn]);

  return <>{children}</>;
}
