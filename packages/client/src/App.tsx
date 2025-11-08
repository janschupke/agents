import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import ChatBot from './components/ChatBot';
import BotConfig from './components/BotConfig';
import AuthButtons from './components/AuthButtons';
import UserDropdown from './components/UserDropdown';
import UserProfile from './components/UserProfile';
import { UserService } from './services/user.service';
import { User } from './types/chat.types';
import { IconChat, IconSettings } from './components/Icons';
import { Skeleton } from './components/Skeleton';

type View = 'chat' | 'config' | 'profile';

function App() {
  const [view, setView] = useState<View>('chat');
  const { isSignedIn, isLoaded } = useUser();
  const [userInfo, setUserInfo] = useState<User | null>(null);

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

  return (
    <div className="flex flex-col min-h-screen h-screen overflow-hidden">
      <header className="bg-background-secondary px-6 py-3 shadow-sm border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-secondary">OpenAI Chat</h1>
        <div className="flex items-center gap-3">
          {isLoaded && isSignedIn && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <button
                  onClick={() => setView('chat')}
                  className={`h-8 px-3 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    view === 'chat'
                      ? 'bg-primary text-text-inverse'
                      : 'bg-background text-text-primary hover:bg-background-secondary'
                  }`}
                  title="Chat"
                >
                  <IconChat className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <button
                  onClick={() => setView('config')}
                  className={`h-8 px-3 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    view === 'config'
                      ? 'bg-primary text-text-inverse'
                      : 'bg-background text-text-primary hover:bg-background-secondary'
                  }`}
                  title="Bot Configuration"
                >
                  <IconSettings className="w-4 h-4" />
                  <span className="hidden sm:inline">Config</span>
                </button>
              </div>
              <UserDropdown
                userInfo={userInfo}
                onProfileClick={() => setView('profile')}
              />
            </div>
          )}
          {!isSignedIn && <AuthButtons />}
        </div>
      </header>
      <main className="flex-1 flex justify-center items-start p-6 overflow-hidden">
        {!isLoaded ? (
          <div className="flex items-center justify-center h-full w-full">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ) : !isSignedIn ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-text-secondary mb-4">
                Welcome to OpenAI Chat
              </h2>
              <p className="text-text-secondary mb-6">
                Please sign in or sign up to continue
              </p>
              <AuthButtons />
            </div>
          </div>
        ) : view === 'chat' ? (
          <ChatBot />
        ) : view === 'config' ? (
          <div className="w-full max-w-7xl h-full">
            <BotConfig />
          </div>
        ) : view === 'profile' ? (
          <div className="w-full flex justify-center items-start p-8 overflow-y-auto">
            <UserProfile onClose={() => setView('chat')} />
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;
