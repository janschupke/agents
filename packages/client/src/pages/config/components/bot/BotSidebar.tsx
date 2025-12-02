import { Agent } from '../../../../types/chat.types';
import { IconPlus, IconTrash } from '../../../../components/ui/Icons';
import { SkeletonList } from '../../../../components/ui/feedback';

interface AgentSidebarProps {
  agents: Agent[];
  currentAgentId: number | null;
  onAgentSelect: (agentId: number) => void;
  onNewAgent: () => void;
  loading?: boolean;
  onAgentDelete?: (agentId: number) => void;
}

export default function AgentSidebar({
  agents,
  currentAgentId,
  onAgentSelect,
  onNewAgent,
  loading = false,
  onAgentDelete,
}: AgentSidebarProps) {
  return (
    <div className="flex flex-col w-56 h-full bg-background-tertiary border-r border-border overflow-hidden">
      <div className="px-3 py-2.5 bg-background border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary">Agents</h3>
        <button
          onClick={onNewAgent}
          disabled={loading}
          className="h-6 w-6 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="New Agent"
        >
          <IconPlus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && agents.length === 0 ? (
          <div className="p-3">
            <SkeletonList count={5} />
          </div>
        ) : agents.length === 0 ? (
          <div className="p-4 text-text-tertiary text-center text-sm">No agents yet</div>
        ) : (
          <div className="flex flex-col">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`group flex items-center border-b border-border transition-colors ${
                  currentAgentId === agent.id
                    ? 'bg-primary text-text-inverse'
                    : 'bg-background text-text-primary hover:bg-background-tertiary'
                }`}
              >
                <button
                  onClick={() => onAgentSelect(agent.id)}
                  className="flex-1 px-3 py-2 text-left transition-colors min-w-0 bg-transparent"
                >
                  <div className={`text-sm font-medium truncate ${
                    currentAgentId === agent.id ? 'text-text-inverse' : ''
                  }`}>
                    {agent.name}
                    {agent.id < 0 && <span className="ml-1.5 text-xs opacity-70">(New)</span>}
                  </div>
                  {agent.description && (
                    <div
                      className={`text-xs mt-0.5 truncate ${
                        currentAgentId === agent.id
                          ? 'text-text-inverse opacity-80'
                          : 'text-text-tertiary'
                      }`}
                    >
                      {agent.description}
                    </div>
                  )}
                </button>
                {onAgentDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAgentDelete(agent.id);
                    }}
                    className={`px-2 py-1 transition-colors opacity-0 group-hover:opacity-100 bg-transparent ${
                      currentAgentId === agent.id
                        ? 'text-text-inverse hover:opacity-100'
                        : 'text-text-tertiary hover:text-red-500'
                    }`}
                    title={agent.id < 0 ? 'Cancel' : 'Delete agent'}
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
