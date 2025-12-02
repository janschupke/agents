import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useCurrentUser } from '../hooks/queries/use-user';
import { IconUsers, IconSettings } from './ui/Icons';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { user: clerkUser } = useUser();
  const { data: userInfo } = useCurrentUser();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background-secondary px-8 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-text-secondary">
            {t('app.title')}
          </h1>
          <div className="flex items-center gap-4">
            {userInfo && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                {userInfo.imageUrl || clerkUser?.imageUrl ? (
                  <img
                    src={userInfo.imageUrl || clerkUser?.imageUrl || ''}
                    alt={t('users.admin')}
                    className="w-8 h-8 rounded-full"
                  />
                ) : null}
                <span>
                  {userInfo.firstName || userInfo.lastName
                    ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim()
                    : userInfo.email || t('users.admin')}
                </span>
              </div>
            )}
            <SignOutButton>
              <button className="px-4 py-2 bg-background text-text-primary border border-border rounded-md text-sm font-medium hover:bg-background-secondary transition-colors">
                {t('app.signOut')}
              </button>
            </SignOutButton>
          </div>
        </div>
      </header>

      <nav className="bg-background-secondary border-b border-border px-8">
        <div className="flex gap-1">
          <Link
            to="/users"
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              isActive('/users')
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <IconUsers className="w-4 h-4" />
            {t('navigation.users')}
          </Link>
          <Link
            to="/system-rules"
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              isActive('/system-rules')
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <IconSettings className="w-4 h-4" />
            {t('navigation.systemRules')}
          </Link>
        </div>
      </nav>

      <main className="p-8">{children}</main>
    </div>
  );
}
