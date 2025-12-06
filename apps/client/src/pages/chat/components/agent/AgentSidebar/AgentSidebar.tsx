import { Agent } from '../../../../../types/chat.types';
import {
  IconPlus,
  SkeletonList,
  Sidebar,
  SidebarHeader,
  SidebarContent,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import AgentSidebarItem from '../../../../config/components/agent/shared/AgentSidebarItem';

interface AgentSidebarProps {
  agents: Agent[];
  currentAgentId: number | null;
  onAgentSelect: (agentId: number) => void;
  onNewAgent: () => void;
  loading?: boolean;
}

export default function AgentSidebar({
  agents,
  currentAgentId,
  onAgentSelect,
  onNewAgent,
  loading = false,
}: AgentSidebarProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <Sidebar>
      <SidebarHeader
        title={t('chat.conversations')}
        action={{
          icon: <IconPlus size="md" />,
          onClick: onNewAgent,
          disabled: loading,
          tooltip: t('chat.newAgent'),
        }}
      />
      <SidebarContent
        loading={loading}
        empty={agents.length === 0}
        loadingComponent={
          <div className="p-3">
            <SkeletonList count={5} />
          </div>
        }
        emptyMessage={
          <>
            <p className="mb-1">{t('chat.noAgents')}</p>
            <p className="text-xs">{t('chat.createNewAgent')}</p>
          </>
        }
      >
        <div className="flex flex-col">
          {agents.map((agent) => (
            <AgentSidebarItem
              key={agent.id}
              agent={agent}
              isSelected={currentAgentId === agent.id}
              onClick={() => onAgentSelect(agent.id)}
            />
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
