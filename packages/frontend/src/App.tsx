import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import ChatBot from './components/ChatBot';
import BotConfig from './components/BotConfig';
import AuthButtons from './components/AuthButtons';
import { UserService } from './services/user.service';
import { User } from './types/chat.types';

type View = 'chat' | 'config';

function App() {
  const [view, setView] = useState<View>('chat');
  const { isSignedIn, isLoaded, user: clerkUser } = useUser();
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      loadUserInfo();
    } else {
      setUserInfo(null);
    }
  }, [isSignedIn, isLoaded]);

  const loadUserInfo = async () => {
    setLoadingUser(true);
    try {
      const user = await UserService.getCurrentUser();
      setUserInfo(user);
    } catch (error) {
      console.error('Failed to load user info:', error);
      // Don't clear userInfo on error, keep trying to show what we have
    } finally {
      setLoadingUser(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen h-screen overflow-hidden">
      <header className="bg-background-secondary px-8 py-4 shadow-md flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-secondary">OpenAI Chat</h1>
        <div className="flex items-center gap-4">
          {isLoaded && isSignedIn && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {(userInfo?.imageUrl || clerkUser?.imageUrl) && (
                  <img
                    src={userInfo?.imageUrl || clerkUser?.imageUrl || ''}
                    alt="User"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="text-sm text-text-secondary">
                  {userInfo?.firstName || userInfo?.lastName
                    ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim()
                    : userInfo?.email || clerkUser?.primaryEmailAddress?.emailAddress || 'User'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setView('chat')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'chat'
                      ? 'bg-primary text-text-inverse'
                      : 'bg-background text-text-primary hover:bg-background-secondary'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setView('config')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'config'
                      ? 'bg-primary text-text-inverse'
                      : 'bg-background text-text-primary hover:bg-background-secondary'
                  }`}
                >
                  Bot Configuration
                </button>
              </div>
            </div>
          )}
          <AuthButtons />
        </div>
      </header>
      <main className="flex-1 flex justify-center items-start p-8 overflow-hidden">
        {!isLoaded ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-text-secondary">Loading...</div>
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
        ) : (
          <div className="w-full max-w-7xl h-full">
            <BotConfig />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
