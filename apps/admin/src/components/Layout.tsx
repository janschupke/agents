import { ReactNode } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import AdminHeader from './layout/AdminHeader';
import AdminNavigation from './layout/AdminNavigation';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title={t('app.title')} />
      <AdminNavigation />
      <main className="p-8">{children}</main>
    </div>
  );
}
