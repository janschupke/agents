import { User } from '../types/user.types';
import { formatDate } from '@openai/utils';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Avatar, Badge, Button } from '@openai/ui';
import { Link } from 'react-router-dom';
import { IconEye, IconEdit, IconTrash } from './ui/Icons';
import { ROUTES } from '../constants/routes.constants';

interface UserListProps {
  users: User[];
  loading: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function UserList({
  users,
  loading,
  onView,
  onEdit,
  onDelete,
}: UserListProps) {
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
              <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                {t('users.columns.actions')}
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
                    <Avatar
                      src={user.imageUrl || undefined}
                      name={
                        user.firstName ||
                        user.lastName ||
                        user.email ||
                        t('users.columns.user')
                      }
                      size="md"
                      borderWidth="none"
                      className="w-10 h-10"
                    />
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
                        <Badge
                          key={index}
                          variant={role === 'admin' ? 'primary' : 'secondary'}
                        >
                          {role}
                        </Badge>
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
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Link to={ROUTES.USER_DETAIL(user.id)}>
                      <Button
                        variant="icon"
                        size="sm"
                        tooltip={t('users.list.view')}
                      >
                        <IconEye className="w-5 h-5" />
                      </Button>
                    </Link>
                    <Link to={ROUTES.USER_EDIT(user.id)}>
                      <Button
                        variant="icon"
                        size="sm"
                        tooltip={t('users.list.edit')}
                      >
                        <IconEdit className="w-5 h-5" />
                      </Button>
                    </Link>
                    <Button
                      variant="icon"
                      size="sm"
                      onClick={() => onDelete?.(user.id)}
                      tooltip={t('users.list.delete')}
                      className="hover:text-red-500"
                    >
                      <IconTrash className="w-5 h-5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
