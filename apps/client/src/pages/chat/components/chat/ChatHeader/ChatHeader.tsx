import { useNavigate } from 'react-router-dom';
import { Avatar, Button, IconSettings } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { ROUTES } from '../../../../../constants/routes.constants';
import { Agent } from '../../../../../types/chat.types';

interface ChatHeaderProps {
  agent: Agent | null;
  agentId: number | null;
}

export default function ChatHeader({ agent, agentId }: ChatHeaderProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const navigate = useNavigate();

  const handleConfigure = () => {
    if (agentId) {
      navigate(ROUTES.CONFIG_AGENT(agentId));
    }
  };

  // Only render content elements, not the wrapper (PageHeader provides the wrapper)
  return (
    <>
      {agent && (
        <div className="flex items-center gap-3">
          <Avatar
            src={agent.avatarUrl || undefined}
            name={agent.name}
            size="md"
          />
          <h2 className="text-lg font-semibold text-text-secondary">
            {agent.name}
          </h2>
        </div>
      )}
      <Button
        variant="icon"
        onClick={handleConfigure}
        disabled={!agentId}
        tooltip={agentId ? t('chat.configureAgent') : undefined}
      >
        <IconSettings size="md" />
      </Button>
    </>
  );
}
