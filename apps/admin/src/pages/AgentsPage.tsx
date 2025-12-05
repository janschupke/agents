import { useState } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AgentService } from '../services/agent.service';
import AgentList from '../components/AgentList';
import { ROUTES } from '../constants/routes.constants';
import { queryKeys } from '../hooks/queries/query-keys';

export default function AgentsPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const {
    data: agents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.agent.list(),
    queryFn: () => AgentService.getAllAgents(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => AgentService.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agent.list() });
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
    if (window.confirm(t('agents.delete.confirm'))) {
      setDeletingId(id);
      deleteMutation.mutate(id);
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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-secondary mb-2">
          {t('agents.list.title')}
        </h2>
        <p className="text-text-tertiary text-sm">
          {t('agents.list.total', { count: agents.length })}
        </p>
      </div>
      <AgentList
        agents={agents}
        loading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deletingId={deletingId}
      />
    </div>
  );
}
