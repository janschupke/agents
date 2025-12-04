import { Agent } from '../../../../../types/chat.types';
import {
  IconPlus,
  SkeletonList,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarItem,
  Avatar,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

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
            <SidebarItem
              key={agent.id}
              isSelected={currentAgentId === agent.id}
              onClick={() => onAgentSelect(agent.id)}
            >
              <button
                onClick={() => onAgentSelect(agent.id)}
                className="flex items-center gap-3 px-3 py-2 w-full text-left"
              >
                <Avatar
                  src={agent.avatarUrl || undefined}
                  name={agent.name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {agent.name}
                  </div>
                  {agent.description && (
                    <div className="text-xs text-text-tertiary truncate mt-0.5">
                      {agent.description}
                    </div>
                  )}
                </div>
              </button>
            </SidebarItem>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
