import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import {
  PageHeader,
  PageContent,
  Container,
  Button,
  Avatar,
  Badge,
  Card,
  Skeleton,
} from '@openai/ui';
import { IconEdit, IconTrash, IconArrowLeft } from '../components/ui/Icons';
import { UserService } from '../services/user.service';
import { User } from '../types/user.types';
import { ROUTES } from '../constants/routes.constants';
import { formatDate } from '@openai/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@openai/ui';
import { queryKeys } from '../hooks/queries/query-keys';

export default function UserDetailPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: ['user', id],
    queryFn: () => UserService.getUserById(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => UserService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.list() });
      navigate(ROUTES.USERS);
    },
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
      <Container>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Container>
    );
  }

  if (error || !user) {
    return (
      <Container>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {t('users.detail.error')}
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        leftContent={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.USERS)}
            tooltip={t('users.detail.back')}
          >
            <IconArrowLeft className="w-5 h-5" />
          </Button>
        }
        title={
          user.firstName || user.lastName
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
            : user.email || user.id
        }
        actions={
          <div className="flex gap-2">
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
          </div>
        }
      />
      <PageContent>
        <div className="space-y-6">
          <Card padding="md" variant="outlined">
            <h3 className="text-lg font-semibold text-text-secondary mb-4">
              {t('users.detail.basicInfo')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar
                  src={user.imageUrl || undefined}
                  name={
                    user.firstName ||
                    user.lastName ||
                    user.email ||
                    user.id
                  }
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
                <div className="text-sm text-text-primary">
                  {user.email || '-'}
                </div>
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
        </div>
      </PageContent>
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
              onClick={() => setShowDeleteDialog(false)}
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
    </Container>
  );
}
