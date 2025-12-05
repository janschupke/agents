import { User } from '../../../types/user.types';
import { formatDate } from '@openai/utils';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Avatar, Badge, Button, Table } from '@openai/ui';
import { Link } from 'react-router-dom';
import { IconEye, IconEdit, IconTrash } from '../../../components/ui/Icons';
import { ROUTES } from '../../../constants/routes.constants';
import { ColumnDef } from '@tanstack/react-table';

interface UserListProps {
  users: User[];
  loading: boolean;
  onDelete?: (id: string) => void;
}

export default function UserList({ users, loading, onDelete }: UserListProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'user',
      header: t('users.columns.user'),
      cell: ({ row }: { row: { original: User } }) => {
        const user = row.original;
        return (
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
        );
      },
    },
    {
      accessorKey: 'email',
      header: t('users.columns.email'),
      cell: ({ row }: { row: { original: User } }) => (
        <div className="text-sm text-text-primary">
          {row.original.email || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'roles',
      header: t('users.columns.roles'),
      cell: ({ row }: { row: { original: User } }) => {
        const user = row.original;
        return (
          <div className="flex flex-wrap gap-2">
            {user.roles && user.roles.length > 0 ? (
              user.roles.map((role: string, index: number) => (
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
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('users.columns.created'),
      cell: ({ row }: { row: { original: User } }) => (
        <div className="text-sm text-text-secondary">
          {formatDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      id: 'actions',
      header: t('users.columns.actions'),
      cell: ({ row }: { row: { original: User } }) => {
        const user = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Link to={ROUTES.USER_DETAIL(user.id)}>
              <Button variant="icon" size="sm" tooltip={t('users.view')}>
                <IconEye className="w-5 h-5" />
              </Button>
            </Link>
            <Link to={ROUTES.USER_EDIT(user.id)}>
              <Button variant="icon" size="sm" tooltip={t('users.edit')}>
                <IconEdit className="w-5 h-5" />
              </Button>
            </Link>
            {onDelete && (
              <Button
                variant="icon"
                size="sm"
                onClick={() => onDelete(user.id)}
                tooltip={t('users.delete')}
                className="hover:text-red-500"
              >
                <IconTrash className="w-5 h-5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Table
      data={users}
      columns={columns}
      loading={loading}
      emptyMessage={t('users.empty')}
    />
  );
}
