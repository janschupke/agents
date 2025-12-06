import { Agent } from '../../../../../types/chat.types';
import { SidebarItem, Avatar, IconTrash } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { AgentType } from '@openai/shared-types';
import { Gender } from '../../../../../types/agent.types';

interface AgentSidebarItemProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: (agentId: number) => void;
  showDelete?: boolean;
}

/**
 * Shared agent sidebar item component
 * Displays agent with avatar, name, agent type, age, and gender (if not other)
 */
export default function AgentSidebarItem({
  agent,
  isSelected,
  onClick,
  onDelete,
  showDelete = false,
}: AgentSidebarItemProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  // Build metadata string: agent type, age, gender (if not other)
  const metadataParts: string[] = [];

  if (agent.agentType) {
    const agentTypeLabel =
      agent.agentType === AgentType.GENERAL
        ? t('config.agentType.general')
        : t('config.agentType.languageAssistant');
    metadataParts.push(agentTypeLabel);
  }

  if (agent.configs?.age) {
    metadataParts.push(`${agent.configs.age}`);
  }

  if (agent.configs?.gender && agent.configs.gender !== Gender.NON_BINARY) {
    const genderValue = agent.configs.gender as Gender;
    let genderLabel = '';
    if (genderValue === Gender.MALE) {
      genderLabel = t('config.genderMale');
    } else if (genderValue === Gender.FEMALE) {
      genderLabel = t('config.genderFemale');
    }
    if (genderLabel) {
      metadataParts.push(genderLabel);
    }
  }

  const metadata = metadataParts.length > 0 ? metadataParts.join(' • ') : null;

  return (
    <SidebarItem
      isSelected={isSelected}
      onClick={onClick}
      actions={
        showDelete && onDelete
          ? [
              {
                icon: <IconTrash size="xs" />,
                onClick: () => onDelete(agent.id),
                variant: 'danger' as const,
                tooltip: agent.id < 0 ? t('common.cancel') : t('common.delete'),
              },
            ]
          : undefined
      }
    >
      <button
        onClick={onClick}
        className="flex items-center gap-3 px-3 py-2 w-full text-left"
      >
        <Avatar
          src={agent.avatarUrl || undefined}
          name={agent.name}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{agent.name}</div>
          {metadata && (
            <div className="text-xs text-text-tertiary truncate mt-0.5">
              {metadata}
            </div>
          )}
        </div>
      </button>
    </SidebarItem>
  );
}
