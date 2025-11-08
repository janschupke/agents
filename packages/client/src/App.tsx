import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useUser, SignIn } from '@clerk/clerk-react';
import ChatBot from './components/ChatBot';
import BotConfig from './components/BotConfig';
import UserDropdown from './components/UserDropdown';
import UserProfile from './components/UserProfile';
import { UserService } from './services/user.service';
import { User } from './types/chat.types';
import { IconChat, IconSettings } from './components/Icons';
import { Skeleton } from './components/Skeleton';

function AppContent() {
  const { isSignedIn, isLoaded } = useUser();
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      // Wait a bit for token provider to be ready
      const timer = setTimeout(() => {
        loadUserInfo();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setUserInfo(null);
    }
  }, [isSignedIn, isLoaded]);

  const loadUserInfo = async () => {
    try {
      const user = await UserService.getCurrentUser();
      setUserInfo(user);
    } catch (error: unknown) {
      // Silently fail if it's an expected auth error (no token yet)
      // Otherwise, user info is optional, we can show Clerk user data instead
      if (error && typeof error === 'object' && 'expected' in error && !error.expected) {
        // Only log unexpected errors
      }
      setUserInfo(null);
    }
  };

  const isActiveRoute = (path: string) => location.pathname === path;

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
            <UserDropdown userInfo={userInfo} />
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
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
