import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useLocation } from 'react-router-dom';
import { IconUsers, IconSettings, IconPlus, IconFileText } from '../ui/Icons';
import { ROUTES } from '../../constants/routes.constants';
import AdminNavItem from './AdminNavItem';

export default function AdminNavigation() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === ROUTES.AGENTS) {
      return location.pathname === ROUTES.AGENTS || location.pathname.startsWith('/agents/');
    }
    return location.pathname === path;
  };

  return (
    <nav className="bg-background-secondary border-b border-border px-8">
      <div className="flex gap-1">
        <AdminNavItem to={ROUTES.USERS} icon={<IconUsers className="w-4 h-4" />} isActive={isActive}>
          {t('navigation.users')}
        </AdminNavItem>
        <AdminNavItem to={ROUTES.SYSTEM_RULES} icon={<IconSettings className="w-4 h-4" />} isActive={isActive}>
          {t('navigation.systemRules')}
        </AdminNavItem>
        <AdminNavItem to={ROUTES.AGENT_ARCHETYPES} icon={<IconPlus className="w-4 h-4" />} isActive={isActive}>
          {t('navigation.archetypes')}
        </AdminNavItem>
        <AdminNavItem to={ROUTES.AI_REQUEST_LOGS} icon={<IconFileText className="w-4 h-4" />} isActive={isActive}>
          {t('navigation.aiRequestLogs')}
        </AdminNavItem>
        <AdminNavItem to={ROUTES.AGENTS} icon={<IconUsers className="w-4 h-4" />} isActive={isActive}>
          {t('navigation.agents')}
        </AdminNavItem>
      </div>
    </nav>
  );
}
