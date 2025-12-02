import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useUsers } from '../hooks/queries/use-user';
import UserList from '../components/UserList';

export default function UsersPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { data: users = [], isLoading: loading, error } = useUsers();

  const errorMessage =
    error && typeof error === 'object' && 'status' in error
      ? error.status === 403
        ? t('users.accessDenied')
        : ('message' in error && error.message) || t('users.error')
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-text-secondary">{t('users.loading')}</div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
        {errorMessage}
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
