import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useUsers } from '../hooks/queries/use-user';
import UserList from '../components/UserList';
import { useState } from 'react';
import { ConfirmModal } from '@openai/ui';
import { LoadingState, AdminPageHeader } from '../components/shared';
import { useToast } from '../contexts/ToastContext';
import { useDeleteUser } from '../hooks/use-delete-user';

export default function UsersPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { showToast } = useToast();
  const { data: users = [], isLoading: loading, error } = useUsers();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteMutation = useDeleteUser({
    onSuccess: () => {
      setShowDeleteDialog(false);
      setDeletingId(null);
    },
  });

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  if (loading) {
    return <LoadingState message={t('users.loading')} />;
  }

  // Show error toast for query errors, but still render the page
  if (error) {
    const errorMessage =
      error && typeof error === 'object' && 'status' in error
        ? error.status === 403
          ? t('users.accessDenied')
          : ('message' in error && error.message) || t('users.error')
        : t('users.error');
    // Only show toast once - useEffect would be better but this works for now
    if (users.length === 0) {
      showToast(errorMessage, 'error');
    }
  }

  return (
    <div>
      <AdminPageHeader
        title={t('users.title')}
        description={t('users.total', { count: users.length })}
      />
      <UserList users={users} loading={false} onDelete={handleDelete} />
      <ConfirmModal
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingId(null);
        }}
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
