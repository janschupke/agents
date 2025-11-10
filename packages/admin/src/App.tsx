import { useState, useEffect } from 'react';
import { useUser, SignInButton, SignOutButton } from '@clerk/clerk-react';
import { UserService } from './services/user.service';
import { User } from './types/user.types';
import UserList from './components/UserList';

function App() {
  const { isSignedIn, isLoaded, user: clerkUser } = useUser();
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
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
      setUsers([]);
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

      // Load all users
      await loadUsers();
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

  const loadUsers = async () => {
    try {
      const allUsers = await UserService.getAllUsers();
      setUsers(allUsers);
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err?.status === 403) {
        setError('Access denied. Admin role required.');
      } else {
        setError(err?.message || 'Failed to load users');
      }
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md bg-background-secondary rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-semibold text-text-secondary mb-2">
            Access Denied
          </h1>
          <p className="text-text-tertiary mb-6">{error}</p>
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
    <div className="min-h-screen bg-background">
      <header className="bg-background-secondary px-8 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-text-secondary">
            Admin Portal
          </h1>
          <div className="flex items-center gap-4">
            {userInfo && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                {userInfo.imageUrl || clerkUser?.imageUrl ? (
                  <img
                    src={userInfo.imageUrl || clerkUser?.imageUrl || ''}
                    alt="Admin"
                    className="w-8 h-8 rounded-full"
                  />
                ) : null}
                <span>
                  {userInfo.firstName || userInfo.lastName
                    ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim()
                    : userInfo.email || 'Admin'}
                </span>
              </div>
            )}
            <SignOutButton>
              <button className="px-4 py-2 bg-background text-text-primary border border-border rounded-md text-sm font-medium hover:bg-background-secondary transition-colors">
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </header>
      <main className="p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text-secondary mb-2">
            All Users
          </h2>
          <p className="text-text-tertiary text-sm">
            Total: {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <UserList users={users} loading={false} />
      </main>
    </div>
  );
}

export default App;
