import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconChevronDown,
  Avatar,
  Button,
  ButtonVariant,
  DropdownTransition,
} from '@openai/ui';
import { useAgents } from '../../../../hooks/queries/use-agents';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useClickOutside } from '../../hooks/ui/use-click-outside';
import { LocalStorageManager } from '../../../../utils/localStorage';
import { ROUTES, isChatRoute } from '../../../../constants/routes.constants';

export default function AgentSelector() {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: agents = [], isLoading: loadingAgents } = useAgents();

  // Get agentId from localStorage (for chat view)
  const selectedAgentId = LocalStorageManager.getSelectedAgentIdChat();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

  const currentAgent = agents.find((a) => a.id === selectedAgentId);
  const displayName = currentAgent?.name || t('config.selectAgent');

  const handleAgentSelect = (agentId: number) => {
    LocalStorageManager.setSelectedAgentIdChat(agentId);
    setIsOpen(false);
    
    // If we're on a chat route, navigate to /chat to force ChatRoute to re-read agentId
    // This ensures the sidebar refreshes with sessions for the new agent
    // Using replace: false ensures React Router treats it as a navigation even if already on /chat
    if (isChatRoute(location.pathname)) {
      // Navigate away and back to force re-render, or use a state-based approach
      // The simplest: navigate to /chat which will cause ChatRoute to re-run useChatRoute
      // and read the new agentId from localStorage
      navigate(ROUTES.CHAT, { replace: true, state: { agentChanged: Date.now() } });
    }
  };

  if (loadingAgents || agents.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant={ButtonVariant.ICON}
        className="flex items-center gap-3 h-10 px-2 rounded-md"
        tooltip={t('config.selectAgent')}
      >
        <Avatar
          src={currentAgent?.avatarUrl || undefined}
          name={displayName}
          size="md"
        />
        <h2 className="text-lg font-semibold text-text-secondary">
          {displayName}
        </h2>
        <IconChevronDown
          className={`w-4 h-4 text-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      <DropdownTransition show={isOpen}>
        <div className="absolute left-0 mt-1 w-56 bg-background border border-border py-1 z-[100] max-h-64 overflow-y-auto">
          {agents.map((agent) => (
            <Button
              key={agent.id}
              onClick={() => handleAgentSelect(agent.id)}
              variant={ButtonVariant.ICON}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                agent.id === selectedAgentId
                  ? 'bg-primary text-text-inverse'
                  : 'text-text-primary hover:bg-background-tertiary'
              }`}
            >
              <Avatar
                src={agent.avatarUrl || undefined}
                name={agent.name}
                size="sm"
              />
              <span className="truncate">{agent.name}</span>
              {agent.id === selectedAgentId && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </Button>
          ))}
        </div>
      </DropdownTransition>
    </div>
  );
}
