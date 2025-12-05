import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Button, Avatar, Badge, Card, Skeleton } from '@openai/ui';
import { IconEdit, IconTrash } from '../components/ui/Icons';
import { UserService } from '../services/user.service';
import { User } from '../types/user.types';
import { ROUTES } from '../constants/routes.constants';
import { formatDate } from '@openai/utils';
import { useState } from 'react';
import { ConfirmModal } from '@openai/ui';
import { queryKeys } from '../hooks/queries/query-keys';
import { PageHeaderWithBack } from '../components/shared';
import { useDeleteUser } from '../hooks/user';

export default function UserDetailPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { id } = useParams<{ id: string }>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: queryKeys.user.detail(id!),
    queryFn: () => UserService.getUserById(id!),
    enabled: !!id,
  });

  const deleteMutation = useDeleteUser({
    redirectOnSuccess: true,
  });

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (id) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {t('users.detail.error')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeaderWithBack
        title={
          user.firstName || user.lastName
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
            : user.email || user.id
        }
        backPath={ROUTES.USERS}
        actions={
          <>
            <Link to={ROUTES.USER_EDIT(user.id)}>
              <Button variant="secondary" size="sm">
                <IconEdit className="w-4 h-4" />
                {t('users.detail.edit')}
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              tooltip={t('users.detail.delete')}
            >
              <IconTrash className="w-4 h-4" />
              {t('users.detail.delete')}
            </Button>
          </>
        }
      />

      <Card padding="md" variant="outlined">
        <h3 className="text-lg font-semibold text-text-secondary mb-4">
          {t('users.detail.basicInfo')}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={user.imageUrl || undefined}
              name={user.firstName || user.lastName || user.email || user.id}
              size="lg"
              borderWidth="none"
              className="w-16 h-16"
            />
            <div>
              <div className="text-sm text-text-tertiary">
                {t('users.detail.userId')}
              </div>
              <div className="text-sm font-mono text-text-primary">
                {user.id}
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm text-text-tertiary mb-1">
              {t('users.columns.email')}
            </div>
            <div className="text-sm text-text-primary">{user.email || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-text-tertiary mb-1">
              {t('users.columns.name')}
            </div>
            <div className="text-sm text-text-primary">
              {user.firstName || user.lastName
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : '-'}
            </div>
          </div>
          <div>
            <div className="text-sm text-text-tertiary mb-1">
              {t('users.columns.roles')}
            </div>
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
          </div>
          <div>
            <div className="text-sm text-text-tertiary mb-1">
              {t('users.columns.created')}
            </div>
            <div className="text-sm text-text-primary">
              {formatDate(user.createdAt)}
            </div>
          </div>
        </div>
      </Card>
      <ConfirmModal
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title={t('users.delete.confirm')}
        message={t('users.delete.confirmMessage')}
        confirmText={
          deleteMutation.isPending
            ? t('users.delete.deleting')
            : t('users.delete.confirm')
        }
        cancelText={t('users.delete.cancel')}
        confirmVariant="danger"
      />
    </div>
  );
}
