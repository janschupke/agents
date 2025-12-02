import { useState, useEffect, useCallback } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { UserService } from '../services/user.service';
import { User } from '../types/user.types';
import UserList from '../components/UserList';

export default function UsersPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allUsers = await UserService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      const error = err as { status?: number; message?: string };
      if (error?.status === 403) {
        setError(t('users.accessDenied'));
      } else {
        setError(error?.message || t('users.error'));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-text-secondary">{t('users.loading')}</div>
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
          {t('users.title')}
        </h2>
        <p className="text-text-tertiary text-sm">
          {t('users.total', { count: users.length })}
        </p>
      </div>
      <UserList users={users} loading={false} />
    </div>
  );
}
