import { Link, useLocation } from 'react-router-dom';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { IconUsers, IconSettings, IconPlus } from '../ui/Icons';

export default function AdminNavigation() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
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
        <Link
          to="/agent-archetypes"
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
            isActive('/agent-archetypes')
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <IconPlus className="w-4 h-4" />
          {t('navigation.archetypes')}
        </Link>
      </div>
    </nav>
  );
}
