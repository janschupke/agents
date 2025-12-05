import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, ConfirmModal } from '@openai/ui';
import { AgentMemoriesList } from '../components/agent';
import { ROUTES } from '../constants/routes.constants';
import { IconEdit, IconTrash } from '../components/ui/Icons';
import { queryKeys } from '../hooks/queries/query-keys';
import { LoadingState, PageHeaderWithBack } from '../components/shared';
import { useState, useEffect } from 'react';
import { useDeleteAgent } from '../hooks/agent';
import { AgentService } from '../services/agent.service';
import { useToast } from '../contexts/ToastContext';
import { extractErrorMessage } from '../utils/extract-error-message';
import {
  AgentBasicInfo,
  AgentConfiguration,
  AgentDemographics,
} from '../components/agent/detail';

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

  const { showToast } = useToast();
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

  // Show error toast if there's an error
  useEffect(() => {
    if (agentError) {
      const errorMessage = extractErrorMessage(
        agentError,
        t('agents.detail.error')
      );
      showToast(errorMessage, 'error');
    }
  }, [agentError, showToast, t]);

  if (!agentId) {
    return (
      <div className="text-text-secondary">{t('agents.detail.notFound')}</div>
    );
  }

  if (loadingAgent) {
    return <LoadingState message={t('agents.detail.loading')} />;
  }

  if (!agent) {
    return null; // Error is handled by toast
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
        <AgentBasicInfo agent={agent} />
        <AgentConfiguration agent={agent} />
        <AgentDemographics agent={agent} />

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
        message={
          t('agents.delete.confirmMessage') || t('agents.delete.confirm')
        }
        confirmText={t('agents.delete.confirm')}
        cancelText={t('agents.delete.cancel') || 'Cancel'}
        confirmVariant="danger"
      />
    </div>
  );
}
