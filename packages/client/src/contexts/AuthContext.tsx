import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useUser } from '@clerk/clerk-react';

interface AuthContextValue {
  isSignedIn: boolean;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const [authState, setAuthState] = useState<AuthContextValue>({
    isSignedIn: false,
    isLoaded: false,
  });

  useEffect(() => {
    setAuthState({
      isSignedIn: isSignedIn ?? false,
      isLoaded,
    });
  }, [isSignedIn, isLoaded]);

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
