import { useUser, SignOutButton } from '@clerk/clerk-react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Avatar, Button } from '@openai/ui';
import { useCurrentUser } from '../../hooks/queries/use-user';

interface AdminHeaderProps {
  title: string;
}

export default function AdminHeader({ title }: AdminHeaderProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { user: clerkUser } = useUser();
  const { data: userInfo } = useCurrentUser();

  const displayName =
    userInfo?.firstName || userInfo?.lastName
      ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim()
      : userInfo?.email || t('users.admin');

  return (
    <header className="bg-background-secondary px-8 py-4 shadow-md">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-secondary">{title}</h1>
        <div className="flex items-center gap-4">
          {userInfo && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Avatar
                src={userInfo.imageUrl || clerkUser?.imageUrl || undefined}
                name={displayName}
                size="sm"
                borderWidth="none"
                className="w-8 h-8"
              />
              <span>{displayName}</span>
            </div>
          )}
          <SignOutButton>
            <Button variant="secondary" size="sm">
              {t('app.signOut')}
            </Button>
          </SignOutButton>
        </div>
      </div>
    </header>
  );
}
