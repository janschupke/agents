import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Agent } from '../../types/agent.types';
import { DetailCard } from '../shared';

interface AgentConfigurationProps {
  agent: Agent;
}

export default function AgentConfiguration({
  agent,
}: AgentConfigurationProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  return (
    <DetailCard title={t('agents.detail.configuration')}>
      <div className="space-y-3 text-sm">
        {agent.configs?.temperature !== undefined && (
          <div>
            <div className="text-text-tertiary">
              {t('agents.detail.temperature')}
            </div>
            <div className="text-text-primary mt-1">
              {agent.configs.temperature}
            </div>
          </div>
        )}
        {agent.configs?.model && (
          <div>
            <div className="text-text-tertiary">{t('agents.detail.model')}</div>
            <div className="text-text-primary mt-1">{agent.configs.model}</div>
          </div>
        )}
        {agent.configs?.max_tokens && (
          <div>
            <div className="text-text-tertiary">
              {t('agents.detail.maxTokens')}
            </div>
            <div className="text-text-primary mt-1">
              {agent.configs.max_tokens}
            </div>
          </div>
        )}
        {agent.configs?.response_length && (
          <div>
            <div className="text-text-tertiary">
              {t('agents.detail.responseLength')}
            </div>
            <div className="text-text-primary mt-1">
              {agent.configs.response_length}
            </div>
          </div>
        )}
        {agent.configs?.system_prompt && (
          <div>
            <div className="text-text-tertiary">
              {t('agents.detail.systemPrompt')}
            </div>
            <div className="text-text-primary mt-1 text-xs bg-background-secondary p-2 rounded">
              {agent.configs.system_prompt}
            </div>
          </div>
        )}
      </div>
    </DetailCard>
  );
}
