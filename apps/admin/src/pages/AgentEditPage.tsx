import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@openai/ui';
import { AgentService } from '../services/agent.service';
import { Agent, UpdateAgentRequest } from '../types/agent.types';
import { ROUTES } from '../constants/routes.constants';
import { IconArrowLeft } from '../components/ui/Icons';
import { queryKeys } from '../hooks/queries/query-keys';
import AgentForm from '../components/AgentForm';
import { AgentFormMode, AgentFormData } from '../types/agent-form.types';
import {
  ResponseLength,
  Gender,
  Sentiment,
  Availability,
} from '../types/agent.types';
import { PersonalityType } from '@openai/shared-types';

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

  const mapAgentToFormData = (
    agent: Agent | undefined
  ): AgentFormData | null => {
    if (!agent) return null;

    const configs = agent.configs || {};
    return {
      name: agent.name || '',
      description: agent.description || undefined,
      avatarUrl: agent.avatarUrl || undefined,
      agentType: agent.agentType || undefined,
      language: agent.language || undefined,
      temperature: configs.temperature as number | undefined,
      systemPrompt: (configs.system_prompt as string) || undefined,
      model: (configs.model as string) || undefined,
      maxTokens: configs.max_tokens as number | undefined,
      responseLength: (configs.response_length as ResponseLength) || undefined,
      age: configs.age as number | undefined,
      gender: (configs.gender as Gender) || undefined,
      personality: (configs.personality as PersonalityType) || undefined,
      sentiment: (configs.sentiment as Sentiment) || undefined,
      interests: (configs.interests as string[]) || undefined,
      availability: (configs.availability as Availability) || undefined,
    };
  };

  const mapFormDataToUpdateRequest = (
    data: AgentFormData
  ): UpdateAgentRequest => {
    const configs: Record<string, unknown> = {};

    if (data.temperature !== undefined) {
      configs.temperature = data.temperature;
    }
    if (data.systemPrompt) {
      configs.system_prompt = data.systemPrompt;
    }
    if (data.model) {
      configs.model = data.model;
    }
    if (data.maxTokens !== undefined) {
      configs.max_tokens = data.maxTokens;
    }
    if (data.responseLength) {
      configs.response_length = data.responseLength;
    }
    if (data.age !== undefined) {
      configs.age = data.age;
    }
    if (data.gender) {
      configs.gender = data.gender;
    }
    if (data.personality) {
      configs.personality = data.personality;
    }
    if (data.sentiment) {
      configs.sentiment = data.sentiment;
    }
    if (data.interests && data.interests.length > 0) {
      configs.interests = data.interests;
    }
    if (data.availability) {
      configs.availability = data.availability;
    }

    return {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      avatarUrl: data.avatarUrl?.trim() || undefined,
      agentType: data.agentType || undefined,
      language: data.language?.trim() || undefined,
      configs: Object.keys(configs).length > 0 ? configs : undefined,
    };
  };

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
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-text-secondary">{t('agents.edit.loading')}</div>
      </div>
    );
  }

  if (agentError || !agent) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
        {t('agents.edit.error')}
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
            onClick={handleCancel}
            tooltip={t('agents.edit.back')}
          >
            <IconArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold text-text-secondary">
            {t('agents.edit.title')}
          </h2>
        </div>
      </div>

      <AgentForm
        mode={AgentFormMode.AGENT}
        initialData={mapAgentToFormData(agent)}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
