import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUser, SignInButton, SignOutButton } from '@clerk/clerk-react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useCurrentUser } from './pages/users/hooks/use-users';
import Layout from './components/Layout';
import { ToastProvider } from './contexts/ToastContext';
import { LoadingState } from './components/shared';
import { ROUTES } from './constants/routes.constants';

// Lazy load page components for code splitting
const UsersPage = lazy(() => import('./pages/users/UsersPage'));
const UserDetailPage = lazy(() => import('./pages/users/UserDetailPage'));
const UserEditPage = lazy(() => import('./pages/users/UserEditPage'));
const SystemRulesPage = lazy(() => import('./pages/rules/SystemRulesPage'));
const AgentArchetypesPage = lazy(() => import('./pages/agents/AgentArchetypesPage'));
const AiRequestLogsPage = lazy(() => import('./pages/ai-request-logs/AiRequestLogsPage'));
const AgentsPage = lazy(() => import('./pages/agents/AgentsPage'));
const AgentDetailPage = lazy(() => import('./pages/agents/AgentDetailPage'));
const AgentEditPage = lazy(() => import('./pages/agents/AgentEditPage'));

function App() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { isSignedIn, isLoaded } = useUser();
  const {
    data: userInfo,
    isLoading: loading,
    error: userError,
  } = useCurrentUser();

  // Determine error message from query error
  const error =
    userError && typeof userError === 'object' && 'status' in userError
      ? userError.status === 403
        ? t('app.adminRoleRequired')
        : userError.status === 401
          ? t('app.pleaseSignInToContinue')
          : ('message' in userError && userError.message) ||
            t('app.failedToLoadUserData')
      : null;

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">{t('app.loading')}</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md bg-background-secondary rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-semibold text-text-secondary mb-2">
            {t('app.title')}
          </h1>
          <p className="text-text-tertiary mb-6">{t('app.pleaseSignIn')}</p>
          <SignInButton mode="modal">
            <button className="w-full px-4 py-2 bg-primary text-text-inverse rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
              {t('app.signIn')}
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">{t('app.checkingAccess')}</div>
      </div>
    );
  }

  // Check if user has admin role
  const hasAdminAccess =
    userInfo && userInfo.roles && userInfo.roles.includes('admin');

  if (error || (userInfo && !hasAdminAccess)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md bg-background-secondary rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-semibold text-text-secondary mb-2">
            {t('app.accessDenied')}
          </h1>
          <p className="text-text-tertiary mb-6">
            {error || t('app.adminRoleRequired')}
          </p>
          <SignOutButton>
            <button className="px-4 py-2 bg-primary text-text-inverse rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
              {t('app.signOut')}
            </button>
          </SignOutButton>
        </div>
      </div>
    );
  }

  // Don't render routes until we have confirmed admin access
  if (!userInfo || !hasAdminAccess) {
    return null;
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Suspense fallback={<LoadingState message={t('app.loading')} />}>
            <Routes>
              <Route
                path="/"
                element={<Navigate to={ROUTES.USERS} replace />}
              />
              <Route path={ROUTES.USERS} element={<UsersPage />} />
              <Route
                path={ROUTES.USER_DETAIL(':id')}
                element={<UserDetailPage />}
              />
              <Route
                path={ROUTES.USER_EDIT(':id')}
                element={<UserEditPage />}
              />
              <Route path={ROUTES.SYSTEM_RULES} element={<SystemRulesPage />} />
              <Route
                path={ROUTES.AGENT_ARCHETYPES}
                element={<AgentArchetypesPage />}
              />
              <Route
                path={ROUTES.AI_REQUEST_LOGS}
                element={<AiRequestLogsPage />}
              />
              <Route path={ROUTES.AGENTS} element={<AgentsPage />} />
              <Route
                path={ROUTES.AGENT_DETAIL(0).replace('0', ':id')}
                element={<AgentDetailPage />}
              />
              <Route
                path={ROUTES.AGENT_EDIT(0).replace('0', ':id')}
                element={<AgentEditPage />}
              />
            </Routes>
          </Suspense>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
