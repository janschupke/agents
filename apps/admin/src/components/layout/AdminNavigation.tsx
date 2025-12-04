import { Link, useLocation } from 'react-router-dom';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { IconUsers, IconSettings, IconPlus, IconFileText } from '../ui/Icons';
import { ROUTES } from '../../constants/routes.constants';

export default function AdminNavigation() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-background-secondary border-b border-border px-8">
      <div className="flex gap-1">
        <Link
          to={ROUTES.USERS}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
            isActive(ROUTES.USERS)
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <IconUsers className="w-4 h-4" />
          {t('navigation.users')}
        </Link>
        <Link
          to={ROUTES.SYSTEM_RULES}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
            isActive(ROUTES.SYSTEM_RULES)
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <IconSettings className="w-4 h-4" />
          {t('navigation.systemRules')}
        </Link>
        <Link
          to={ROUTES.AGENT_ARCHETYPES}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
            isActive(ROUTES.AGENT_ARCHETYPES)
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <IconPlus className="w-4 h-4" />
          {t('navigation.archetypes')}
        </Link>
        <Link
          to={ROUTES.AI_REQUEST_LOGS}
          className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
            isActive(ROUTES.AI_REQUEST_LOGS)
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <IconFileText className="w-4 h-4" />
          {t('navigation.aiRequestLogs')}
        </Link>
      </div>
    </nav>
  );
}
