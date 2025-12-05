import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Input, Textarea } from '@openai/ui';
import { AgentService } from '../services/agent.service';
import { Agent, UpdateAgentRequest } from '../types/agent.types';
import { ROUTES } from '../constants/routes.constants';
import { IconArrowLeft } from '../components/ui/Icons';

export default function AgentEditPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const agentId = id ? parseInt(id, 10) : null;

  const [formData, setFormData] = useState<UpdateAgentRequest>({
    name: '',
    description: '',
    avatarUrl: '',
    agentType: 'GENERAL',
    language: '',
    configs: {},
  });

  const {
    data: agent,
    isLoading: loadingAgent,
    error: agentError,
  } = useQuery({
    queryKey: ['admin-agent', agentId],
    queryFn: () => AgentService.getAgent(agentId!),
    enabled: !!agentId,
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description || '',
        avatarUrl: agent.avatarUrl || '',
        agentType: agent.agentType || 'GENERAL',
        language: agent.language || '',
        configs: agent.configs || {},
      });
    }
  }, [agent]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateAgentRequest) =>
      AgentService.updateAgent(agentId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agent', agentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
      navigate(ROUTES.AGENT_DETAIL(agentId!));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (agentId) {
      navigate(ROUTES.AGENT_DETAIL(agentId));
    } else {
      navigate(ROUTES.AGENTS);
    }
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title={t('agents.detail.basicInfo')} padding="md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('agents.edit.name')}
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('agents.edit.description')}
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t('agents.edit.avatarUrl')}
              </label>
              <Input
                value={formData.avatarUrl}
                onChange={(e) =>
                  setFormData({ ...formData, avatarUrl: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t('agents.edit.agentType')}
                </label>
                <select
                  value={formData.agentType || 'GENERAL'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      agentType: e.target.value as 'GENERAL' | 'LANGUAGE_ASSISTANT',
                    })
                  }
                  className="w-full p-2 border border-border rounded bg-background text-text-primary"
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="LANGUAGE_ASSISTANT">LANGUAGE_ASSISTANT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {t('agents.edit.language')}
                </label>
                <Input
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  placeholder="en, zh, ja, etc."
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            onClick={handleCancel}
            variant="secondary"
            disabled={updateMutation.isPending}
          >
            {t('agents.edit.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={updateMutation.isPending || !formData.name.trim()}
            loading={updateMutation.isPending}
          >
            {t('agents.edit.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
