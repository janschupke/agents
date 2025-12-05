import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Badge } from '@openai/ui';
import { Agent } from '../../../types/agent.types';
import { DetailCard } from '../../shared';

interface AgentDemographicsProps {
  agent: Agent;
}

export default function AgentDemographics({ agent }: AgentDemographicsProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  if (
    !agent.configs?.age &&
    !agent.configs?.gender &&
    !agent.configs?.personality &&
    !agent.configs?.sentiment &&
    !agent.configs?.availability
  ) {
    return null;
  }

  return (
    <DetailCard title={t('agents.detail.demographics')} gridCols={2}>
      <div className="grid grid-cols-2 gap-4 text-sm">
        {agent.configs?.age !== undefined && (
          <div>
            <div className="text-text-tertiary">{t('agents.detail.age')}</div>
            <div className="text-text-primary mt-1">{agent.configs.age}</div>
          </div>
        )}
        {agent.configs?.gender && (
          <div>
            <div className="text-text-tertiary">
              {t('agents.detail.gender')}
            </div>
            <div className="text-text-primary mt-1">
              {agent.configs.gender}
            </div>
          </div>
        )}
        {agent.configs?.personality && (
          <div>
            <div className="text-text-tertiary">
              {t('agents.detail.personality')}
            </div>
            <div className="text-text-primary mt-1">
              {agent.configs.personality}
            </div>
          </div>
        )}
        {agent.configs?.sentiment && (
          <div>
            <div className="text-text-tertiary">
              {t('agents.detail.sentiment')}
            </div>
            <div className="text-text-primary mt-1">
              {agent.configs.sentiment}
            </div>
          </div>
        )}
        {agent.configs?.availability && (
          <div>
            <div className="text-text-tertiary">
              {t('agents.detail.availability')}
            </div>
            <div className="text-text-primary mt-1">
              {agent.configs.availability}
            </div>
          </div>
        )}
        {agent.configs?.interests &&
          Array.isArray(agent.configs.interests) &&
          agent.configs.interests.length > 0 && (
            <div className="col-span-2">
              <div className="text-text-tertiary">
                {t('agents.detail.interests')}
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {agent.configs.interests.map((interest: string, i: number) => (
                  <Badge key={i} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
      </div>
    </DetailCard>
  );
}
