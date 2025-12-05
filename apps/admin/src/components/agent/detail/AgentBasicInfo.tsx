import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Avatar, Badge } from '@openai/ui';
import { Agent } from '../../../types/agent.types';
import { formatDate } from '@openai/utils';
import { DetailCard } from '../../shared';

interface AgentBasicInfoProps {
  agent: Agent;
}

export default function AgentBasicInfo({ agent }: AgentBasicInfoProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  return (
    <DetailCard title={t('agents.detail.basicInfo')} gridCols={2}>
      <div className="space-y-4">
        <div className="flex items-center gap-4 col-span-2">
          <Avatar
            src={agent.avatarUrl || undefined}
            name={agent.name}
            size="lg"
            borderWidth="none"
            className="w-16 h-16"
          />
          <div>
            <div className="font-semibold text-text-primary">{agent.name}</div>
            {agent.description && (
              <div className="text-sm text-text-secondary mt-1">
                {agent.description}
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="text-text-tertiary">{t('agents.detail.type')}</div>
          <div className="text-text-primary mt-1">
            {agent.agentType ? (
              <Badge variant="primary">{agent.agentType}</Badge>
            ) : (
              '-'
            )}
          </div>
        </div>
        <div>
          <div className="text-text-tertiary">
            {t('agents.detail.language')}
          </div>
          <div className="text-text-primary mt-1">
            {agent.language || '-'}
          </div>
        </div>
        <div>
          <div className="text-text-tertiary">{t('agents.detail.userId')}</div>
          <div className="text-text-primary mt-1 font-mono text-xs">
            {agent.userId.substring(0, 8)}...
          </div>
        </div>
        <div>
          <div className="text-text-tertiary">
            {t('agents.detail.createdAt')}
          </div>
          <div className="text-text-primary mt-1">
            {formatDate(agent.createdAt)}
          </div>
        </div>
      </div>
    </DetailCard>
  );
}
