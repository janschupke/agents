import { User } from '../types/user.types';
import { formatDate } from '@openai/utils';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface UserListProps {
  users: User[];
  loading: boolean;
}

export default function UserList({ users, loading }: UserListProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">{t('users.loading')}</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">{t('users.noUsersFound')}</div>
      </div>
    );
  }

  return (
    <div className="bg-background-secondary rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background-tertiary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                {t('users.columns.user')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                {t('users.columns.email')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                {t('users.columns.roles')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                {t('users.columns.created')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-background-tertiary transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={
                          user.firstName ||
                          user.email ||
                          t('users.columns.user')
                        }
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-text-inverse font-semibold">
                        {(
                          user.firstName ||
                          user.email ||
                          t('users.columns.user')
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {user.firstName || user.lastName
                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          : t('users.columns.user')}
                      </div>
                      <div className="text-xs text-text-tertiary font-mono">
                        {user.id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-text-primary">
                    {user.email || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-2">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            role === 'admin'
                              ? 'bg-primary text-text-inverse'
                              : 'bg-background-tertiary text-text-secondary'
                          }`}
                        >
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-tertiary">
                        {t('users.noRoles')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                  {formatDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
