import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useUsers } from '../hooks/queries/use-user';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import UserList from '../components/UserList';
import { UserService } from '../services/user.service';
import { useState } from 'react';
import { queryKeys } from '../hooks/queries/query-keys';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from '@openai/ui';

export default function UsersPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { data: users = [], isLoading: loading, error } = useUsers();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => UserService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.list() });
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
      <UserList users={users} loading={false} onDelete={handleDelete} />
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader onClose={() => setShowDeleteDialog(false)}>
            <DialogTitle>{t('users.delete.confirm')}</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <p className="text-sm text-text-primary">
              {t('users.delete.confirmMessage')}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingId(null);
              }}
            >
              {t('users.delete.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? t('users.delete.deleting')
                : t('users.delete.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
