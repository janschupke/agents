import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useUser, SignIn } from '@clerk/clerk-react';
import ChatBot from './components/ChatBot';
import BotConfig from './components/BotConfig';
import UserDropdown from './components/UserDropdown';
import UserProfile from './components/UserProfile';
import { ApiCredentialsService } from './services/api-credentials.service';
import { IconChat, IconSettings } from './components/Icons';
import { Skeleton } from './components/Skeleton';
import { AppProvider, useUserInfo } from './contexts/AppContext';

function AppContent() {
  const { isSignedIn, isLoaded } = useUser();
  const { userInfo } = useUserInfo();
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  const location = useLocation();

  const checkApiKey = useCallback(async () => {
    setApiKeyLoading(true);
    try {
      const hasKey = await ApiCredentialsService.hasOpenAIKey();
      setHasApiKey(hasKey);
    } catch (error) {
      // If check fails, assume no key (will redirect to profile)
      setHasApiKey(false);
    } finally {
      setApiKeyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      // Wait a bit for token provider to be ready
      const timer = setTimeout(() => {
        checkApiKey();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setHasApiKey(null);
      setApiKeyLoading(true);
    }
  }, [isSignedIn, isLoaded, checkApiKey]);

  // Re-check API key when location changes (especially after saving on profile page)
  useEffect(() => {
    if (isSignedIn && isLoaded && location.pathname !== '/profile') {
      // Re-check API key when navigating away from profile page
      checkApiKey();
    }
  }, [location.pathname, isSignedIn, isLoaded, checkApiKey]);

  // Listen for API key save event from UserProfile component
  useEffect(() => {
    if (!isSignedIn || !isLoaded) return;

    const handleApiKeySaved = () => {
      // Re-check API key status when it's saved
      checkApiKey();
    };

    window.addEventListener('apiKeySaved', handleApiKeySaved);
    return () => {
      window.removeEventListener('apiKeySaved', handleApiKeySaved);
    };
  }, [isSignedIn, isLoaded, checkApiKey]);

  const isActiveRoute = (path: string) => location.pathname === path;

  // Show loading while checking API key
  if (isSignedIn && isLoaded && apiKeyLoading && location.pathname !== '/profile') {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  // Redirect to profile if no API key (except if already on profile page)
  if (
    isSignedIn &&
    isLoaded &&
    hasApiKey === false &&
    location.pathname !== '/profile' &&
    location.pathname !== '/'
  ) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen h-screen overflow-hidden">
      <header className="bg-background-secondary px-6 py-3 shadow-sm border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-secondary">OpenAI Chat</h1>
        {isLoaded && isSignedIn && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Link
                to="/chat"
                className={`h-8 px-3 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActiveRoute('/chat')
                    ? 'bg-primary text-text-inverse'
                    : 'bg-background text-text-primary hover:bg-background-secondary'
                }`}
                title="Chat"
              >
                <IconChat className="w-4 h-4" />
                <span className="hidden sm:inline">Chat</span>
              </Link>
              <Link
                to="/config"
                className={`h-8 px-3 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActiveRoute('/config')
                    ? 'bg-primary text-text-inverse'
                    : 'bg-background text-text-primary hover:bg-background-secondary'
                }`}
                title="Bot Configuration"
              >
                <IconSettings className="w-4 h-4" />
                <span className="hidden sm:inline">Config</span>
              </Link>
            </div>
            <UserDropdown />
          </div>
        )}
      </header>
      <main className="flex-1 flex justify-center items-start p-6 overflow-hidden">
        {!isLoaded ? (
          <div className="flex items-center justify-center h-full w-full">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                isSignedIn ? <Navigate to="/chat" replace /> : <SignInPage />
              }
            />
            <Route
              path="/chat"
              element={
                isSignedIn ? (
                  <ChatBot />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/config"
              element={
                isSignedIn ? (
                  <div className="w-full max-w-7xl h-full">
                    <BotConfig />
                  </div>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/profile"
              element={
                isSignedIn ? (
                  <div className="w-full flex justify-center items-start p-8 overflow-y-auto">
                    <UserProfile />
                  </div>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          </Routes>
        )}
      </main>
    </div>
  );
}

function SignInPage() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <SignIn />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
