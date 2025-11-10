import { useState, useEffect } from 'react';
import { UserService } from '../services/user.service';
import { User } from '../types/user.types';
import UserList from '../components/UserList';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const allUsers = await UserService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      const error = err as { status?: number; message?: string };
      if (error?.status === 403) {
        setError('Access denied. Admin role required.');
      } else {
        setError(error?.message || 'Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-text-secondary">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-secondary mb-2">
          All Users
        </h2>
        <p className="text-text-tertiary text-sm">
          Total: {users.length} user{users.length !== 1 ? 's' : ''}
        </p>
      </div>
      <UserList users={users} loading={false} />
    </div>
  );
}
