import { Agent } from '../../../../types/chat.types';
import {
  IconPlus,
  IconTrash,
  SkeletonList,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarItem,
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
            <SidebarItem
              key={agent.id}
              isSelected={currentAgentId === agent.id}
              primaryText={
                <>
                  {agent.name}
                  {agent.id < 0 && (
                    <span className="ml-1.5 text-xs opacity-70">(New)</span>
                  )}
                </>
              }
              secondaryText={agent.description}
              onClick={() => onAgentSelect(agent.id)}
              actions={
                onAgentDelete
                  ? [
                      {
                        icon: <IconTrash className="w-4 h-4" />,
                        onClick: () => onAgentDelete(agent.id),
                        variant: 'danger' as const,
                        tooltip: agent.id < 0 ? 'Cancel' : 'Delete agent',
                      },
                    ]
                  : undefined
              }
            />
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
