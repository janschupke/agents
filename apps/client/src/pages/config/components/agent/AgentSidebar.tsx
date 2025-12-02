import { Agent } from '../../../../types/chat.types';
import {
  IconPlus,
  IconTrash,
  SkeletonList,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  Button,
  ButtonVariant,
} from '@openai/ui';

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
    <Sidebar>
      <SidebarHeader
        title="Agents"
        action={{
          icon: <IconPlus className="w-4 h-4" />,
          onClick: onNewAgent,
          disabled: loading,
          tooltip: 'New Agent',
        }}
      />
      <SidebarContent
        loading={loading && agents.length === 0}
        empty={!loading && agents.length === 0}
        loadingComponent={
          <div className="p-3">
            <SkeletonList count={5} />
          </div>
        }
        emptyMessage="No agents yet"
      >
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
                <div
                  className={`text-sm font-medium truncate ${
                    currentAgentId === agent.id ? 'text-text-inverse' : ''
                  }`}
                >
                  {agent.name}
                  {agent.id < 0 && (
                    <span className="ml-1.5 text-xs opacity-70">(New)</span>
                  )}
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
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAgentDelete(agent.id);
                  }}
                  variant={ButtonVariant.SECONDARY}
                  size="sm"
                  className={`px-2 py-1 opacity-0 group-hover:opacity-100 bg-transparent ${
                    currentAgentId === agent.id
                      ? 'text-text-inverse hover:opacity-100'
                      : 'text-text-tertiary hover:text-red-500'
                  }`}
                  tooltip={agent.id < 0 ? 'Cancel' : 'Delete agent'}
                >
                  <IconTrash className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
