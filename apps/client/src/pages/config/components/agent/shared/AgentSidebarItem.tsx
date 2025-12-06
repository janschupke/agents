import { Agent } from '../../../../../types/chat.types';
import { SidebarItem, Avatar, IconTrash, IconTranslate, Button, Tooltip } from '@openai/ui';
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

  // Build metadata string: age and gender (always show if available)
  const metadataParts: string[] = [];

  // Check age - must be a valid positive number (not 0, undefined, or null)
  if (
    agent.configs?.age !== undefined &&
    agent.configs?.age !== null &&
    typeof agent.configs.age === 'number' &&
    !isNaN(agent.configs.age) &&
    agent.configs.age > 0
  ) {
    metadataParts.push(`${agent.configs.age}`);
  }

  // Check gender - must be a valid gender value
  if (agent.configs?.gender) {
    const genderValue = agent.configs.gender as string;
    let genderLabel = '';
    if (genderValue === Gender.MALE) {
      genderLabel = t('config.genderMale');
    } else if (genderValue === Gender.FEMALE) {
      genderLabel = t('config.genderFemale');
    } else if (genderValue === Gender.NON_BINARY) {
      genderLabel = t('config.genderOther');
    }
    if (genderLabel) {
      metadataParts.push(genderLabel);
    }
  }

  const metadata = metadataParts.length > 0 ? metadataParts.join(' • ') : null;
  const isLanguageAssistant = agent.agentType === AgentType.LANGUAGE_ASSISTANT;

  const showDeleteButton = showDelete && onDelete;

  return (
    <SidebarItem
      isSelected={isSelected}
      onClick={onClick}
    >
      <div className="flex items-center group">
        <button
          onClick={onClick}
          className="flex items-center gap-3 px-3 py-2 flex-1 text-left min-w-0"
        >
          <Avatar
            src={agent.avatarUrl || undefined}
            name={agent.name}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-medium truncate flex-1 min-w-0">
                {agent.name}
              </span>
              {isLanguageAssistant && (
                <Tooltip
                  content={t('config.agentType.languageAssistant')}
                  position="top"
                  wrapperClassName="flex-shrink-0"
                >
                  <IconTranslate
                    className="w-3.5 h-3.5 text-text-secondary opacity-70"
                  />
                </Tooltip>
              )}
            </div>
            {metadata && (
              <div className="text-xs text-text-tertiary truncate mt-0.5">
                {metadata}
              </div>
            )}
          </div>
        </button>
        {showDeleteButton && (
          <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={(e?: React.MouseEvent<HTMLButtonElement>) => {
                e?.stopPropagation();
                onDelete(agent.id);
              }}
              variant={isSelected ? 'ghost-inverse' : 'ghost'}
              size="xs"
              className={`p-1 ${
                isSelected
                  ? 'text-text-inverse hover:opacity-100'
                  : 'text-text-primary hover:text-red-500'
              }`}
              tooltip={agent.id < 0 ? t('common.cancel') : t('common.delete')}
            >
              <IconTrash size="xs" />
            </Button>
          </div>
        )}
      </div>
    </SidebarItem>
  );
}
