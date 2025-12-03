import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconChevronDown,
  Avatar,
  Button,
  DropdownTransition,
} from '@openai/ui';
import { useAgents } from '../../../../../hooks/queries/use-agents';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useClickOutside } from '../../../../config/hooks/ui/use-click-outside';
import { LocalStorageManager } from '../../../../../utils/localStorage';
import { ROUTES, isChatRoute } from '../../../../../constants/routes.constants';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../../../hooks/queries/query-keys';
import { Session } from '../../../../../types/chat.types';
import { SessionService } from '../../../../../services/chat/session/session.service';

export default function AgentSelector() {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
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
    setIsOpen(false);

    // Update localStorage for persistence
    LocalStorageManager.setSelectedAgentIdChat(agentId);

    // If we're on a chat route, navigate to new agent route
    if (isChatRoute(location.pathname)) {
      // Get most recent session for this agent (if available)
      const agentSessions = queryClient.getQueryData<Session[]>(
        queryKeys.agents.sessions(agentId)
      );
      const mostRecentSession = agentSessions?.[0];

      // Navigate to new route
      if (mostRecentSession) {
        navigate(ROUTES.CHAT_SESSION(agentId, mostRecentSession.id), {
          replace: true,
        });
      } else {
        navigate(ROUTES.CHAT_AGENT(agentId), { replace: true });
      }
    }
  };

  if (loadingAgents || agents.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="icon"
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
            <div
              key={agent.id}
              onMouseEnter={() => {
                // Prefetch sessions for this agent on hover
                queryClient.prefetchQuery({
                  queryKey: queryKeys.agents.sessions(agent.id),
                  queryFn: () => SessionService.getSessions(agent.id),
                });
              }}
            >
              <Button
                onClick={() => handleAgentSelect(agent.id)}
                variant="icon"
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 justify-start ${
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
                  <span className="ml-auto text-xs">✓ </span>
                )}
              </Button>
            </div>
          ))}
        </div>
      </DropdownTransition>
    </div>
  );
}
