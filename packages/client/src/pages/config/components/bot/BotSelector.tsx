import { useState, useRef, useEffect } from 'react';
import { IconChevronDown } from '../../../../components/ui/Icons';
import { useAgents } from '../../../../hooks/queries/use-bots';
import { useSelectedAgent } from '../../../../contexts/AppContext';
import { DropdownTransition } from '../../../../components/ui/animation';

export default function AgentSelector() {
  const { data: agents = [], isLoading: loadingAgents } = useAgents();
  const { selectedAgentId, setSelectedAgentId } = useSelectedAgent();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentAgent = agents.find((a) => a.id === selectedAgentId);
  const displayName = currentAgent?.name || 'Select Agent';

  const handleAgentSelect = (agentId: number) => {
    setSelectedAgentId(agentId);
    setIsOpen(false);
  };

  if (loadingAgents || agents.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 h-10 px-2 rounded-md hover:bg-background-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Select agent"
      >
        {currentAgent?.avatarUrl ? (
          <img
            src={currentAgent.avatarUrl}
            alt={currentAgent.name}
            className="w-10 h-10 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-text-inverse text-sm font-semibold border border-border">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <h2 className="text-lg font-semibold text-text-secondary">{displayName}</h2>
        <IconChevronDown
          className={`w-4 h-4 text-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <DropdownTransition show={isOpen}>
        <div className="absolute left-0 mt-1 w-56 bg-background border border-border py-1 z-[100] max-h-64 overflow-y-auto">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => handleAgentSelect(agent.id)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                agent.id === selectedAgentId
                  ? 'bg-primary text-text-inverse'
                  : 'text-text-primary hover:bg-background-tertiary'
              }`}
            >
              {agent.avatarUrl ? (
                <img
                  src={agent.avatarUrl}
                  alt={agent.name}
                  className="w-5 h-5 rounded-full object-cover border border-border flex-shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-text-inverse text-xs font-semibold border border-border flex-shrink-0">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate">{agent.name}</span>
              {agent.id === selectedAgentId && <span className="ml-auto text-xs">✓</span>}
            </button>
          ))}
        </div>
      </DropdownTransition>
    </div>
  );
}
