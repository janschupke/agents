import { memo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { ChatBot } from './pages/chat';
import { BotConfig } from './pages/config';
import { UserProfile } from './pages/profile';
import UserDropdown from './components/auth/UserDropdown';
import { Footer } from './components/ui/layout';
import { IconChat, IconSettings } from './components/ui/Icons';
import { Skeleton } from './components/ui/feedback';
import { PageTransition } from './components/ui/animation';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProvider, useApiKeyStatus } from './contexts/UserContext';
import { BotProvider } from './contexts/BotContext';
import { ChatProvider } from './contexts/ChatContext';
import { ToastProvider } from './contexts/ToastContext';
import { QueryProvider } from './providers/QueryProvider';

// Memoized Header component to prevent re-renders
const AppHeader = memo(function AppHeader() {
  const location = useLocation();
  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <header className="bg-background px-6 py-3 border-b border-border flex items-center justify-between">
      <h1 className="text-xl font-semibold text-text-primary">OpenAI Chat</h1>
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
    </header>
  );
});

// Memoized Footer component to prevent re-renders
const AppFooter = memo(Footer);

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Welcome</h1>
          <p className="text-text-secondary">Sign in to continue</p>
        </div>
        <div className="bg-background border border-border p-6">
          <SignIn />
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const { hasApiKey, loadingApiKey } = useApiKeyStatus();
  const location = useLocation();

  // Show sign-in page when not signed in
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <SignInPage />;
  }

  // Show loading while checking API key
  if (loadingApiKey && location.pathname !== '/profile') {
    return (
      <div className="flex flex-col min-h-screen h-screen overflow-hidden">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  // Redirect to profile if no API key (except if already on profile page)
  if (hasApiKey === false && location.pathname !== '/profile' && location.pathname !== '/') {
    return <Navigate to="/profile" replace />;
  }

  // Authenticated layout with header, content, and footer
  return (
    <div className="flex flex-col min-h-screen h-screen overflow-hidden bg-background">
      <AppHeader />
      <main className="flex-1 overflow-hidden">
        <PageTransition>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatBot />} />
            <Route path="/config" element={<BotConfig />} />
            <Route path="/profile" element={<UserProfile />} />
          </Routes>
        </PageTransition>
      </main>
      <AppFooter />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryProvider>
          <AppProvider>
            <UserProvider>
              <BotProvider>
                <ChatProvider>
                  <ToastProvider>
                    <AppContent />
                  </ToastProvider>
                </ChatProvider>
              </BotProvider>
            </UserProvider>
          </AppProvider>
        </QueryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
