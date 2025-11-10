import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUser, SignInButton, SignOutButton } from '@clerk/clerk-react';
import { UserService } from './services/user.service';
import { User } from './types/user.types';
import Layout from './components/Layout';
import UsersPage from './pages/UsersPage';
import SystemRulesPage from './pages/SystemRulesPage';

function App() {
  const { isSignedIn, isLoaded } = useUser();
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn && isLoaded) {
      // Wait a bit for token provider to be ready
      const timer = setTimeout(() => {
        checkAdminAccess();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setUserInfo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isLoaded]);

  const checkAdminAccess = async () => {
    setLoading(true);
    setError(null);
    try {
      // First check if user is authenticated and get their info
      const currentUser = await UserService.getCurrentUser();
      setUserInfo(currentUser);

      // Check if user has admin role
      if (!currentUser.roles.includes('admin')) {
        setError('Access denied. Admin role required.');
        setLoading(false);
        return;
      }
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err?.status === 403) {
        setError('Access denied. Admin role required.');
      } else if (err?.status === 401) {
        setError('Please sign in to continue.');
      } else {
        setError(err?.message || 'Failed to load user data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md bg-background-secondary rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-semibold text-text-secondary mb-2">
            Admin Portal
          </h1>
          <p className="text-text-tertiary mb-6">
            Please sign in with an admin account to continue.
          </p>
          <SignInButton mode="modal">
            <button className="w-full px-4 py-2 bg-primary text-text-inverse rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-secondary">Checking access...</div>
      </div>
    );
  }

  if (error || !userInfo || !userInfo.roles.includes('admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md bg-background-secondary rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-semibold text-text-secondary mb-2">
            Access Denied
          </h1>
          <p className="text-text-tertiary mb-6">
            {error || 'Admin role required.'}
          </p>
          <SignOutButton>
            <button className="px-4 py-2 bg-primary text-text-inverse rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout userInfo={userInfo}>
        <Routes>
          <Route path="/" element={<Navigate to="/users" replace />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/system-rules" element={<SystemRulesPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
