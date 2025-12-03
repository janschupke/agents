import { memo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { MainTitle, IconChat, IconSettings } from '@openai/ui';
import UserDropdown from '../auth/UserDropdown';
import { ROUTES } from '../../constants/routes.constants';

/**
 * Top navigation bar component.
 * Contains main app title and navigation links.
 * Extracted from AppHeader in App.tsx
 */
const TopNavigation = memo(function TopNavigation() {
  const { t: tCommon } = useTranslation(I18nNamespace.COMMON);
  const { t: tClient } = useTranslation(I18nNamespace.CLIENT);
  const location = useLocation();
  const isActiveRoute = (path: string) =>
    location.pathname === path ||
    (path === ROUTES.CHAT && location.pathname.startsWith('/chat/')) ||
    (path === ROUTES.CONFIG && location.pathname.startsWith('/config/'));

  return (
    <header className="bg-background px-6 py-3 border-b border-border flex items-center justify-between">
      <MainTitle>{tCommon('app.title')}</MainTitle>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <Link
            to={ROUTES.CHAT}
            className={`h-8 px-3 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isActiveRoute(ROUTES.CHAT)
                ? 'bg-primary text-text-inverse'
                : 'bg-background text-text-primary hover:bg-background-secondary'
            }`}
            title={tClient('navigation.chat')}
          >
            <IconChat className="w-4 h-4" />
            <span className="hidden sm:inline">
              {tClient('navigation.chat')}
            </span>
          </Link>
          <Link
            to={ROUTES.CONFIG}
            className={`h-8 px-3 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isActiveRoute(ROUTES.CONFIG)
                ? 'bg-primary text-text-inverse'
                : 'bg-background text-text-primary hover:bg-background-secondary'
            }`}
            title={tClient('navigation.agentConfiguration')}
          >
            <IconSettings className="w-4 h-4" />
            <span className="hidden sm:inline">
              {tClient('navigation.config')}
            </span>
          </Link>
        </div>
        <UserDropdown />
      </div>
    </header>
  );
});

export default TopNavigation;
