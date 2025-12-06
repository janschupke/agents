import { NavigateFunction } from 'react-router-dom';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { ROUTES } from '../../../../constants/routes.constants';
import { useCreateAgent } from '../../../../hooks/mutations/use-agent-mutations';
import { useToast } from '../../../../contexts/ToastContext';
import { Agent } from '../../../../types/chat.types';
import { CreateAgentRequest } from '../../../../types/chat.types';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
}

interface UseNewAgentNavigationOptions {
  formData: Partial<Agent>;
  navigate: NavigateFunction;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

/**
 * Hook to handle new agent navigation and save logic
 */
export function useNewAgentNavigation({
  formData,
  navigate,
  confirm,
}: UseNewAgentNavigationOptions) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const { showToast } = useToast();
  const createAgentMutation = useCreateAgent();

  const handleSave = async () => {
    try {
      const agentData: CreateAgentRequest = {
        name: formData.name || '',
        description: formData.description || undefined,
        avatarUrl: formData.avatarUrl || undefined,
        configs: formData.configs,
      };
      const savedAgent = await createAgentMutation.mutateAsync(agentData);
      showToast(t('config.messages.agentCreated'), 'success');
      navigate(ROUTES.CONFIG_AGENT(savedAgent.id), { replace: true });
    } catch (error) {
      const errorMessage =
        (error as Error)?.message || t('config.errors.createFailed');
      showToast(errorMessage, 'error');
      throw error;
    }
  };

  const handleCancel = async () => {
    const hasChanges = Boolean(
      formData.name?.trim() ||
        formData.description?.trim() ||
        formData.avatarUrl
    );

    if (hasChanges) {
      const confirmed = await confirm({
        title: t('config.confirm.unsavedChangesTitle'),
        message: t('config.confirm.unsavedChangesMessage'),
        confirmText: t('common.leave'),
        cancelText: t('common.cancel'),
      });
      if (!confirmed) {
        return;
      }
    }
    navigate(ROUTES.CONFIG);
  };

  return { handleSave, handleCancel };
}
