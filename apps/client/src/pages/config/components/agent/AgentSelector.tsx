import { useState, useRef } from 'react';
import {
  IconChevronDown,
  Avatar,
  Button,
  ButtonVariant,
  DropdownTransition,
} from '@openai/ui';
import { useAgents } from '../../../../hooks/queries/use-agents';
import { useSelectedAgent } from '../../../../contexts/AppContext';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useClickOutside } from '../../hooks/use-click-outside';

export default function AgentSelector() {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const { data: agents = [], isLoading: loadingAgents } = useAgents();
  const { selectedAgentId, setSelectedAgentId } = useSelectedAgent();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

  const currentAgent = agents.find((a) => a.id === selectedAgentId);
  const displayName = currentAgent?.name || t('config.selectAgent');

  const handleAgentSelect = (agentId: number) => {
    setSelectedAgentId(agentId);
    setIsOpen(false);
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
