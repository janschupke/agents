import { useState } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AgentService } from '../services/agent.service';
import AgentList from '../components/AgentList';
import { ROUTES } from '../constants/routes.constants';
import { queryKeys } from '../hooks/queries/query-keys';
import { AdminPageHeader } from '../components/shared';
import { useDeleteAgent } from '../hooks/use-delete-agent';
import { ConfirmModal } from '@openai/ui';

export default function AgentsPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: agents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.agent.list(),
    queryFn: () => AgentService.getAllAgents(),
  });

  const deleteMutation = useDeleteAgent({
    onSuccess: () => {
      setShowDeleteDialog(false);
      setDeletingId(null);
    },
  });

  const handleView = (id: number) => {
    navigate(ROUTES.AGENT_DETAIL(id));
  };

  const handleEdit = (id: number) => {
    navigate(ROUTES.AGENT_EDIT(id));
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  if (error) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {t('agents.list.error')}
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title={t('agents.list.title')}
        description={t('agents.list.total', { count: agents.length })}
      />
      <AgentList
        agents={agents}
        loading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deletingId={deletingId}
      />
      <ConfirmModal
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        title={t('agents.delete.confirm')}
        message={t('agents.delete.confirmMessage') || t('agents.delete.confirm')}
        confirmText={
          deleteMutation.isPending
            ? t('agents.delete.deleting') || 'Deleting...'
            : t('agents.delete.confirm')
        }
        cancelText={t('agents.delete.cancel') || 'Cancel'}
        confirmVariant="danger"
      />
    </div>
  );
}
