import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Avatar, Badge } from '@openai/ui';
import { AgentService } from '../services/agent.service';
import { Agent, AgentMemory } from '../types/agent.types';
import AgentMemoriesList from '../components/AgentMemoriesList';
import { ROUTES } from '../constants/routes.constants';
import { IconEdit, IconTrash, IconArrowLeft } from '../components/ui/Icons';
import { formatDate } from '@openai/utils';

export default function AgentDetailPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const agentId = id ? parseInt(id, 10) : null;

  const {
    data: agent,
    isLoading: loadingAgent,
    error: agentError,
  } = useQuery({
    queryKey: ['admin-agent', agentId],
    queryFn: () => AgentService.getAgent(agentId!),
    enabled: !!agentId,
  });

  const {
    data: memories = [],
    isLoading: loadingMemories,
  } = useQuery({
    queryKey: ['admin-agent-memories', agentId],
    queryFn: () => AgentService.getAgentMemories(agentId!),
    enabled: !!agentId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => AgentService.deleteAgent(agentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      navigate(ROUTES.AGENTS);
    },
  });

  const handleEdit = () => {
    if (agentId) {
      navigate(ROUTES.AGENT_EDIT(agentId));
    }
  };

  const handleDelete = () => {
    if (window.confirm(t('agents.delete.confirm'))) {
      deleteMutation.mutate();
    }
  };

  if (!agentId) {
    return (
      <div className="text-text-secondary">{t('agents.detail.notFound')}</div>
    );
  }

  if (loadingAgent) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-text-secondary">{t('agents.detail.loading')}</div>
      </div>
    );
  }

  if (agentError || !agent) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
        {t('agents.detail.error')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="icon"
            size="sm"
            onClick={() => navigate(ROUTES.AGENTS)}
            tooltip={t('agents.detail.back')}
          >
            <IconArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold text-text-secondary">
            {agent.name}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleEdit} size="sm">
            <IconEdit className="w-4 h-4" />
            {t('agents.detail.edit')}
          </Button>
          <Button
            onClick={handleDelete}
            variant="danger"
            size="sm"
            disabled={deleteMutation.isPending}
          >
            <IconTrash className="w-4 h-4" />
            {t('agents.detail.delete')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card title={t('agents.detail.basicInfo')} padding="md">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={agent.avatarUrl || undefined}
                name={agent.name}
                size="lg"
                borderWidth="none"
                className="w-16 h-16"
              />
              <div>
                <div className="font-semibold text-text-primary">
                  {agent.name}
                </div>
                {agent.description && (
                  <div className="text-sm text-text-secondary mt-1">
                    {agent.description}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
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
                <div className="text-text-tertiary">
                  {t('agents.detail.userId')}
                </div>
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
          </div>
        </Card>

        {/* Configuration */}
        <Card title={t('agents.detail.configuration')} padding="md">
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
                <div className="text-text-tertiary">
                  {t('agents.detail.model')}
                </div>
                <div className="text-text-primary mt-1">
                  {agent.configs.model}
                </div>
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
        </Card>

        {/* Demographics */}
        {(agent.configs?.age ||
          agent.configs?.gender ||
          agent.configs?.personality ||
          agent.configs?.sentiment ||
          agent.configs?.availability) && (
          <Card title={t('agents.detail.demographics')} padding="md">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {agent.configs?.age !== undefined && (
                <div>
                  <div className="text-text-tertiary">
                    {t('agents.detail.age')}
                  </div>
                  <div className="text-text-primary mt-1">
                    {agent.configs.age}
                  </div>
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
                      {agent.configs.interests.map((interest, i) => (
                        <Badge key={i} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </Card>
        )}

        {/* Memories */}
        <Card
          title={t('agents.detail.memories')}
          padding="md"
          className="lg:col-span-2"
        >
          <AgentMemoriesList
            agentId={agentId}
            memories={memories}
            loading={loadingMemories}
          />
        </Card>
      </div>
    </div>
  );
}
