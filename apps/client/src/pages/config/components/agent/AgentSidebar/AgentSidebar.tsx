import { Agent } from '../../../../../types/chat.types';
import {
  IconPlus,
  SkeletonList,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarItem,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import AgentSidebarItem from '../shared/AgentSidebarItem';

interface AgentSidebarProps {
  agents: Agent[];
  currentAgentId: number | null;
  onAgentSelect: (agentId: number) => void;
  onNewAgent: () => void;
  loading?: boolean;
  onAgentDelete?: (agentId: number) => void;
  isNewAgentRoute?: boolean;
}

export default function AgentSidebar({
  agents,
  currentAgentId,
  onAgentSelect,
  onNewAgent,
  loading = false,
  onAgentDelete,
  isNewAgentRoute = false,
}: AgentSidebarProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const isNewAgentSelected = isNewAgentRoute || currentAgentId === -1;

  return (
    <Sidebar>
      <SidebarHeader
        title="Agents"
        action={{
          icon: <IconPlus size="sm" />,
          onClick: onNewAgent,
          disabled: loading,
          tooltip: 'New Agent',
        }}
      />
      <SidebarContent
        loading={loading}
        empty={agents.length === 0 && !isNewAgentSelected}
        loadingComponent={
          <div className="p-3">
            <SkeletonList count={5} />
          </div>
        }
        emptyMessage="No agents yet"
      >
        <div className="flex flex-col">
          {isNewAgentSelected && (
            <SidebarItem
              key="new-agent"
              isSelected={true}
              title={t('config.createAgent') || 'New Agent'}
              onClick={() => {}}
            />
          )}
          {agents.map((agent) => (
            <AgentSidebarItem
              key={agent.id}
              agent={agent}
              isSelected={currentAgentId === agent.id && !isNewAgentSelected}
              onClick={() => onAgentSelect(agent.id)}
              onDelete={onAgentDelete}
              showDelete={!!onAgentDelete}
            />
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
