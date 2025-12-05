import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Avatar, Badge, ConfirmModal } from '@openai/ui';
import AgentMemoriesList from '../components/AgentMemoriesList';
import { ROUTES } from '../constants/routes.constants';
import { IconEdit, IconTrash } from '../components/ui/Icons';
import { formatDate } from '@openai/utils';
import { queryKeys } from '../hooks/queries/query-keys';
import { LoadingState, PageHeaderWithBack } from '../components/shared';
import { useState } from 'react';
import { useDeleteAgent } from '../hooks/use-delete-agent';
import { AgentService } from '../services/agent.service';

export default function AgentDetailPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agentId = id ? parseInt(id, 10) : null;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: agent,
    isLoading: loadingAgent,
    error: agentError,
  } = useQuery({
    queryKey: queryKeys.agent.detail(agentId!),
    queryFn: () => AgentService.getAgent(agentId!),
    enabled: !!agentId,
  });

  const { data: memories = [], isLoading: loadingMemories } = useQuery({
    queryKey: queryKeys.agent.memories(agentId!),
    queryFn: () => AgentService.getAgentMemories(agentId!),
    enabled: !!agentId,
  });

  const deleteMutation = useDeleteAgent({
    redirectOnSuccess: true,
  });

  const handleEdit = () => {
    if (agentId) {
      navigate(ROUTES.AGENT_EDIT(agentId));
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (agentId) {
      deleteMutation.mutate(agentId);
    }
  };

  if (!agentId) {
    return (
      <div className="text-text-secondary">{t('agents.detail.notFound')}</div>
    );
  }

  if (loadingAgent) {
    return <LoadingState message={t('agents.detail.loading')} />;
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
      <PageHeaderWithBack
        title={agent.name}
        backPath={ROUTES.AGENTS}
        actions={
          <>
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
          </>
        }
      />

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
                <div className="text-text-tertiary">
                  {t('agents.detail.type')}
                </div>
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
      <ConfirmModal
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title={t('agents.delete.confirm')}
        message={t('agents.delete.confirmMessage') || t('agents.delete.confirm')}
        confirmText={t('agents.delete.confirm')}
        cancelText={t('agents.delete.cancel') || 'Cancel'}
        confirmVariant="danger"
      />
    </div>
  );
}
