import {
  memo,
  useEffect,
  useState,
  useRef,
  ReactNode,
  lazy,
  Suspense,
} from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { ROUTES } from './constants/routes.constants';
import TopNavigation from './components/layout/TopNavigation';
import { Footer, Skeleton, PageContainer } from '@openai/ui';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { QueryProvider } from './providers/QueryProvider';
import { useApiKeyStatus } from './hooks/queries/use-user';
import PageLoadingState from './components/layout/PageLoadingState';

// Lazy load routes for code splitting
const ChatRoute = lazy(
  () => import(/* webpackChunkName: "chat" */ './pages/chat/ChatRoute')
);
const ConfigRoute = lazy(
  () => import(/* webpackChunkName: "config" */ './pages/config/ConfigRoute')
);
const UserProfile = lazy(() =>
  import(/* webpackChunkName: "profile" */ './pages/profile').then(
    (module) => ({ default: module.UserProfile })
  )
);

// Memoized Footer component to prevent re-renders
const AppFooter = memo(Footer);

/**
 * Route transition wrapper component.
 * Animates the content area (Sidebar + Container) on route changes.
 * TopNavigation and Footer remain static (outside this wrapper).
 * Uses flex row to contain Sidebar and Container side by side.
 * Only animates on actual route changes (e.g., /chat to /config), not parameter changes.
 */
function RouteTransitionWrapper({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [routeKey, setRouteKey] = useState(0);
  const previousBaseRouteRef = useRef<string>('');

  useEffect(() => {
    // Extract base route by removing parameters (e.g., /chat/123/456 -> /chat, /config/123 -> /config)
    const baseRoute = location.pathname
      .replace(/\/chat\/\d+\/\d+/, '/chat') // /chat/:agentId/:sessionId -> /chat
      .replace(/\/chat\/\d+/, '/chat') // /chat/:agentId -> /chat
      .replace(/\/config\/\d+/, '/config') // /config/:agentId -> /config
      .replace(/\/config\/new/, '/config'); // /config/new -> /config

    // Only animate if the base route actually changed (not just parameters)
    if (
      previousBaseRouteRef.current !== '' &&
      baseRoute !== previousBaseRouteRef.current
    ) {
      setRouteKey((prev) => prev + 1);
    }
    previousBaseRouteRef.current = baseRoute;
  }, [location.pathname]);

  return (
    <div
      key={routeKey}
      className="flex flex-row flex-1 overflow-hidden animate-fade-in"
    >
      {children}
    </div>
  );
}

function SignInPage() {
  const { t } = useTranslation(I18nNamespace.COMMON);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            {t('app.welcome')}
          </h1>
          <p className="text-text-secondary">{t('app.signIn')}</p>
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
  const { data: apiKeyData, isLoading: loadingApiKey } = useApiKeyStatus();
  const hasApiKey = apiKeyData?.hasApiKey ?? null;
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
  if (loadingApiKey && location.pathname !== ROUTES.PROFILE) {
    return (
      <PageContainer>
        <TopNavigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </main>
        <AppFooter />
      </PageContainer>
    );
  }

  // Redirect to profile if no API key (except if already on profile page)
  if (
    hasApiKey === false &&
    location.pathname !== ROUTES.PROFILE &&
    location.pathname !== ROUTES.ROOT
  ) {
    return <Navigate to={ROUTES.PROFILE} replace />;
  }

  // Authenticated layout with header, content, and footer
  return (
    <PageContainer>
      <TopNavigation />
      <RouteTransitionWrapper>
        <Suspense fallback={<PageLoadingState />}>
          <Routes>
            <Route
              path={ROUTES.ROOT}
              element={<Navigate to={ROUTES.CHAT} replace />}
            />
            <Route path={ROUTES.CHAT} element={<ChatRoute />} />
            <Route path={ROUTES.CHAT_AGENT_PATTERN} element={<ChatRoute />} />
            <Route path={ROUTES.CHAT_SESSION_PATTERN} element={<ChatRoute />} />
            <Route path={ROUTES.CONFIG} element={<ConfigRoute />} />
            <Route path={ROUTES.CONFIG_NEW} element={<ConfigRoute />} />
            <Route
              path={ROUTES.CONFIG_AGENT_PATTERN}
              element={<ConfigRoute />}
            />
            <Route path={ROUTES.PROFILE} element={<UserProfile />} />
          </Routes>
        </Suspense>
      </RouteTransitionWrapper>
      <AppFooter />
    </PageContainer>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryProvider>
          <AppProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </AppProvider>
        </QueryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
