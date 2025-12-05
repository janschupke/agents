import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Button, Card, Skeleton, Input } from '@openai/ui';
import { UserService, UpdateUserRequest } from '../../services/user.service';
import { User } from '../../types/user.types';
import { ROUTES } from '../../constants/routes.constants';
import { useState, useEffect } from 'react';
import { queryKeys } from '../../hooks/queries/query-keys';
import { PageHeaderWithBack } from '../../components/shared';

export default function UserEditPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: queryKeys.user.detail(id!),
    queryFn: () => UserService.getUserById(id!),
    enabled: !!id,
  });

  const [formData, setFormData] = useState<UpdateUserRequest>({
    email: '',
    firstName: '',
    lastName: '',
    imageUrl: '',
    roles: [],
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        imageUrl: user.imageUrl || '',
        roles: user.roles || [],
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserRequest) => UserService.updateUser(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.detail(id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.list() });
      navigate(ROUTES.USERS);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => {
      const roles = prev.roles || [];
      const newRoles = roles.includes(role)
        ? roles.filter((r) => r !== role)
        : [...roles, role];
      return { ...prev, roles: newRoles };
    });
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
          {t('users.edit.error')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeaderWithBack
        title={t('users.edit.title')}
        backPath={ROUTES.USERS}
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.USERS)}
            >
              {t('users.edit.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e?.preventDefault();
                if (e) {
                  handleSubmit(
                    e as unknown as React.FormEvent<HTMLFormElement>
                  );
                }
              }}
              disabled={updateMutation.isPending}
              loading={updateMutation.isPending}
            >
              {updateMutation.isPending
                ? t('users.edit.saving')
                : t('users.edit.save')}
            </Button>
          </>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card padding="md" variant="outlined">
          <h3 className="text-lg font-semibold text-text-secondary mb-4">
            {t('users.edit.basicInfo')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('users.columns.email')}
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('users.columns.name')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder={t('users.edit.firstName')}
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
                <Input
                  placeholder={t('users.edit.lastName')}
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('users.edit.imageUrl')}
              </label>
              <Input
                type="url"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('users.columns.roles')}
              </label>
              <div className="flex flex-wrap gap-2">
                {['admin', 'user'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleToggle(role)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      formData.roles?.includes(role)
                        ? 'bg-primary text-text-inverse'
                        : 'bg-background-tertiary text-text-secondary hover:bg-background-secondary'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
