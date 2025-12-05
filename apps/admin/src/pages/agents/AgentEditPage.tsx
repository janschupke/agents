import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentService } from '../../services/agent.service';
import { ROUTES } from '../../constants/routes.constants';
import { queryKeys } from '../../hooks/queries/query-keys';
import { AgentForm } from './components/agent/form';
import { AgentFormMode, AgentFormData } from '../../types/agent-form.types';
import { LoadingState, PageHeaderWithBack } from '../../components/shared';
import {
  mapToFormData,
  mapFormDataToUpdateRequest,
} from './hooks/use-agent-form-mapping';
import { UpdateAgentRequest } from '../../types/agent.types';

export default function AgentEditPage() {
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
    queryKey: queryKeys.agent.detail(agentId!),
    queryFn: () => AgentService.getAgent(agentId!),
    enabled: !!agentId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateAgentRequest) =>
      AgentService.updateAgent(agentId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agent.detail(agentId!),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.agent.list() });
      navigate(ROUTES.AGENTS);
    },
  });

  const handleSubmit = async (data: AgentFormData) => {
    const requestData = mapFormDataToUpdateRequest(data);
    updateMutation.mutate(requestData);
  };

  const handleCancel = () => {
    navigate(ROUTES.AGENTS);
  };

  if (!agentId) {
    return (
      <div className="text-text-secondary">{t('agents.edit.notFound')}</div>
    );
  }

  if (loadingAgent) {
    return <LoadingState message={t('agents.edit.loading')} />;
  }

  if (agentError || !agent) {
    return (
      <div className="bg-error-light border border-error-border text-error-text px-4 py-3 rounded-md">
        {t('agents.edit.error')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeaderWithBack
        title={t('agents.edit.title')}
        backPath={ROUTES.AGENTS}
      />

      <AgentForm
        mode={AgentFormMode.AGENT}
        initialData={mapToFormData(agent)}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
