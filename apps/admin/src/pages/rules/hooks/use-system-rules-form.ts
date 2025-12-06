import { useState, useEffect } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { HTTP_STATUS } from '@openai/shared-types';
import { AgentType } from '../../../types/agent.types';
import { useSystemRules, useUpdateSystemRules } from './use-system-rules';
import { useToast } from '../../../contexts/ToastContext';
import {
  validateAll,
  systemRulesFormValidationSchema,
} from '@openai/utils';

export interface AgentTypeFormData {
  rules: string[];
  systemPrompt: string;
}

type TabType = AgentType;

export function useSystemRulesForm() {
  const { t: tAdmin } = useTranslation(I18nNamespace.ADMIN);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>(AgentType.GENERAL);

  // Separate form data for each agent type
  const [formData, setFormData] = useState<Record<TabType, AgentTypeFormData>>({
    [AgentType.GENERAL]: { rules: [], systemPrompt: '' },
    [AgentType.LANGUAGE_ASSISTANT]: { rules: [], systemPrompt: '' },
  });

  // Validation state per tab
  const [validationErrors, setValidationErrors] = useState<
    Record<TabType, string | null>
  >({
    [AgentType.GENERAL]: null,
    [AgentType.LANGUAGE_ASSISTANT]: null,
  });

  // Load data for all tabs
  const mainData = useSystemRules(null);
  const generalData = useSystemRules(AgentType.GENERAL);
  const languageAssistantData = useSystemRules(AgentType.LANGUAGE_ASSISTANT);

  const updateMutation = useUpdateSystemRules();

  // Sync rules and system prompt from query data for each tab
  useEffect(() => {
    const data = mainData.data as
      | { rules: string[]; system_prompt?: string }
      | undefined;
    if (data) {
      setFormData((prev) => ({
        ...prev,
        main: {
          rules: data.rules || [],
          systemPrompt: data.system_prompt || '',
        },
      }));
    } else if (!mainData.isLoading && !mainData.isError) {
      // No data and not loading/erroring means empty state
      setFormData((prev) => ({
        ...prev,
        main: { rules: [], systemPrompt: '' },
      }));
    }
  }, [mainData.data, mainData.isLoading, mainData.isError]);

  useEffect(() => {
    const data = generalData.data as
      | { rules: string[]; system_prompt?: string }
      | undefined;
    if (data) {
      setFormData((prev) => ({
        ...prev,
        [AgentType.GENERAL]: {
          rules: data.rules || [],
          systemPrompt: data.system_prompt || '',
        },
      }));
    } else if (!generalData.isLoading && !generalData.isError) {
      // No data and not loading/erroring means empty state
      setFormData((prev) => ({
        ...prev,
        [AgentType.GENERAL]: { rules: [], systemPrompt: '' },
      }));
    }
  }, [generalData.data, generalData.isLoading, generalData.isError]);

  useEffect(() => {
    const data = languageAssistantData.data as
      | { rules: string[]; system_prompt?: string }
      | undefined;
    if (data) {
      setFormData((prev) => ({
        ...prev,
        [AgentType.LANGUAGE_ASSISTANT]: {
          rules: data.rules || [],
          systemPrompt: data.system_prompt || '',
        },
      }));
    } else if (
      !languageAssistantData.isLoading &&
      !languageAssistantData.isError
    ) {
      // No data and not loading/erroring means empty state
      setFormData((prev) => ({
        ...prev,
        [AgentType.LANGUAGE_ASSISTANT]: { rules: [], systemPrompt: '' },
      }));
    }
  }, [
    languageAssistantData.data,
    languageAssistantData.isLoading,
    languageAssistantData.isError,
  ]);

  // Show success message after successful save
  useEffect(() => {
    if (updateMutation.isSuccess && updateMutation.variables) {
      showToast(tAdmin('systemRules.saved'), 'success');
    }
  }, [updateMutation.isSuccess, updateMutation.variables, showToast, tAdmin]);

  const handleRulesChange = (tab: TabType, rules: string[]) => {
    setFormData((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        rules,
      },
    }));
  };

  const handleSystemPromptChange = (tab: TabType, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        systemPrompt: value,
      },
    }));

    // Clear validation error when user types
    if (validationErrors[tab]) {
      setValidationErrors((prev) => ({ ...prev, [tab]: null }));
    }
  };

  const handleSave = (tab: TabType) => {
    const currentFormData = formData[tab];

    // Validate system prompt using centralized validation
    const result = validateAll(
      { systemPrompt: currentFormData.systemPrompt },
      systemRulesFormValidationSchema
    );

    if (!result.isValid && result.errors.systemPrompt) {
      setValidationErrors((prev) => ({
        ...prev,
        [tab]: result.errors.systemPrompt,
      }));
      showToast(result.errors.systemPrompt, 'error');
      return;
    }

    // Clear validation error
    setValidationErrors((prev) => ({ ...prev, [tab]: null }));

    updateMutation.mutate(
      {
        rules: currentFormData.rules,
        systemPrompt: currentFormData.systemPrompt.trim() || undefined,
        agentType: tab,
      },
      {
        onError: (error: unknown) => {
          const errorMessage =
            error && typeof error === 'object' && 'message' in error
              ? (error.message as string)
              : tAdmin('systemRules.error');
          showToast(errorMessage, 'error');
        },
      }
    );
  };

  const getSystemPromptErrors = (tab: TabType) => {
    return {
      error: validationErrors[tab],
      touched: false, // We only show errors on save attempt
    };
  };

  const getError = (tab: TabType) => {
    const queryData =
      tab === AgentType.GENERAL ? generalData : languageAssistantData;

    const queryError = queryData.error;
    return queryError &&
      typeof queryError === 'object' &&
      'status' in queryError
      ? queryError.status === HTTP_STATUS.NOT_FOUND
        ? null // 404 is expected when no rules are set
        : ('message' in queryError && queryError.message) ||
          tAdmin('systemRules.error')
      : updateMutation.error &&
          typeof updateMutation.error === 'object' &&
          'message' in updateMutation.error
        ? (updateMutation.error.message as string)
        : updateMutation.isError
          ? tAdmin('systemRules.error')
          : null;
  };

  const isLoading =
    mainData.isLoading ||
    generalData.isLoading ||
    languageAssistantData.isLoading;

  return {
    activeTab,
    setActiveTab,
    formData,
    updateMutation,
    handleRulesChange,
    handleSystemPromptChange,
    handleSave,
    getError,
    getSystemPromptErrors,
    isLoading,
  };
}
