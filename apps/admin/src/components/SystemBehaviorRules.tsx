import { useState, useEffect } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { NUMERIC_CONSTANTS, HTTP_STATUS } from '@openai/shared-types';
import { Button } from '@openai/ui';
import {
  useSystemRules,
  useUpdateSystemRules,
} from '../hooks/queries/use-system-rules';
import { IconTrash, IconPlus } from './ui/Icons';
import { AgentType } from '../types/agent.types';

type TabType = AgentType;

interface AgentTypeFormData {
  rules: string[];
  systemPrompt: string;
}

export default function SystemBehaviorRules() {
  const { t: tAdmin } = useTranslation(I18nNamespace.ADMIN);
  const { t: tCommon } = useTranslation(I18nNamespace.COMMON);
  const [activeTab, setActiveTab] = useState<TabType>(AgentType.GENERAL);
  
  // Separate form data for each agent type
  const [formData, setFormData] = useState<Record<TabType, AgentTypeFormData>>({
    [AgentType.GENERAL]: { rules: [], systemPrompt: '' },
    [AgentType.LANGUAGE_ASSISTANT]: { rules: [], systemPrompt: '' },
  });

  // Load data for all tabs
  const mainData = useSystemRules(null);
  const generalData = useSystemRules(AgentType.GENERAL);
  const languageAssistantData = useSystemRules(AgentType.LANGUAGE_ASSISTANT);
  
  const updateMutation = useUpdateSystemRules();
  const [success, setSuccess] = useState<Record<TabType, boolean>>({
    [AgentType.GENERAL]: false,
    [AgentType.LANGUAGE_ASSISTANT]: false,
  });

  // Sync rules and system prompt from query data for each tab
  useEffect(() => {
    const data = mainData.data as { rules: string[]; system_prompt?: string } | undefined;
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
    const data = generalData.data as { rules: string[]; system_prompt?: string } | undefined;
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
    const data = languageAssistantData.data as { rules: string[]; system_prompt?: string } | undefined;
    if (data) {
      setFormData((prev) => ({
        ...prev,
        [AgentType.LANGUAGE_ASSISTANT]: {
          rules: data.rules || [],
          systemPrompt: data.system_prompt || '',
        },
      }));
    } else if (!languageAssistantData.isLoading && !languageAssistantData.isError) {
      // No data and not loading/erroring means empty state
      setFormData((prev) => ({
        ...prev,
        [AgentType.LANGUAGE_ASSISTANT]: { rules: [], systemPrompt: '' },
      }));
    }
  }, [languageAssistantData.data, languageAssistantData.isLoading, languageAssistantData.isError]);

  // Show success message after successful save
  useEffect(() => {
    if (updateMutation.isSuccess && updateMutation.variables) {
      const savedTab: TabType = updateMutation.variables.agentType as AgentType;
      setSuccess((prev) => ({ ...prev, [savedTab]: true }));
      const timer = setTimeout(
        () => setSuccess((prev) => ({ ...prev, [savedTab]: false })),
        NUMERIC_CONSTANTS.UI_NOTIFICATION_DURATION
      );
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [updateMutation.isSuccess, updateMutation.variables]);

  const handleSave = async (tab: TabType) => {
    const currentFormData = formData[tab];
    
    updateMutation.mutate(
      {
        rules: currentFormData.rules,
        systemPrompt: currentFormData.systemPrompt.trim() || undefined,
        agentType: tab,
      },
      {
        onError: () => {
          // Error is handled by mutation state
        },
      }
    );
  };

  const getError = (tab: TabType) => {
    const queryData =
      tab === AgentType.GENERAL
        ? generalData
        : languageAssistantData;
    
    const queryError = queryData.error;
    return queryError && typeof queryError === 'object' && 'status' in queryError
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

  const handleAddRule = (tab: TabType) => {
    setFormData((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        rules: [...prev[tab].rules, ''],
      },
    }));
  };

  const handleRemoveRule = (tab: TabType, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        rules: prev[tab].rules.filter((_, i) => i !== index),
      },
    }));
  };

  const handleRuleChange = (tab: TabType, index: number, value: string) => {
    setFormData((prev) => {
      const newRules = [...prev[tab].rules];
      newRules[index] = value;
      return {
        ...prev,
        [tab]: {
          ...prev[tab],
          rules: newRules,
        },
      };
    });
  };

  const handleSystemPromptChange = (tab: TabType, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        systemPrompt: value,
      },
    }));
  };

  const isLoading =
    mainData.isLoading ||
    generalData.isLoading ||
    languageAssistantData.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-text-secondary">{tAdmin('app.loading')}</div>
      </div>
    );
  }

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: AgentType.GENERAL, label: tAdmin('systemRules.general') },
    { id: AgentType.LANGUAGE_ASSISTANT, label: AgentType.LANGUAGE_ASSISTANT },
  ];

  const renderForm = (tab: TabType) => {
    const currentFormData = formData[tab];
    const error = getError(tab);
    const isSuccess = success[tab];

    return (
      <div className="space-y-6">
        {error && (
          <div className="bg-message-error border border-border text-text-primary px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {isSuccess && (
          <div className="bg-message-success border border-border text-text-primary px-4 py-3 rounded-md text-sm">
            {tAdmin('systemRules.saved')}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {tAdmin('systemRules.systemPromptLabel') ||
              'Authoritative System Prompt'}
          </label>
          <textarea
            value={currentFormData.systemPrompt}
            onChange={(e) => handleSystemPromptChange(tab, e.target.value)}
            className="w-full min-h-[120px] px-3 py-2 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus font-mono resize-y"
            placeholder={
              tAdmin('systemRules.systemPromptPlaceholder') ||
              'Enter the authoritative system prompt that will be sent as the first message in every chat request...'
            }
          />
          <p className="text-xs text-text-tertiary mt-2">
            {tAdmin('systemRules.systemPromptDescription') ||
              'This system prompt will be sent as the first SYSTEM role message in every chat request. It is the authoritative system prompt for all agents.'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {tAdmin('systemRules.label')}
          </label>
          <div className="space-y-2">
            {currentFormData.rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={rule}
                  onChange={(e) =>
                    handleRuleChange(tab, index, e.target.value)
                  }
                  className="flex-1 h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus"
                  placeholder={tAdmin('systemRules.rulePlaceholder', {
                    index: (index + 1).toString(),
                  })}
                />
                <Button
                  type="button"
                  variant="icon"
                  size="sm"
                  onClick={() => handleRemoveRule(tab, index)}
                  tooltip={tAdmin('systemRules.removeRule')}
                  className="flex-shrink-0 hover:text-red-600"
                >
                  <IconTrash className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleAddRule(tab)}
              className="w-full"
            >
              <IconPlus className="w-4 h-4" />
              <span>{tAdmin('systemRules.addRule')}</span>
            </Button>
          </div>
          <p className="text-xs text-text-tertiary mt-2">
            {tAdmin('systemRules.placeholder')}
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => handleSave(tab)}
            disabled={updateMutation.isPending}
            loading={updateMutation.isPending}
            size="sm"
          >
            {updateMutation.isPending
              ? tCommon('app.saving')
              : tAdmin('systemRules.save')}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-secondary mb-2">
          {tAdmin('systemRules.title')}
        </h2>
        <p className="text-text-tertiary text-sm">
          {tAdmin('systemRules.description')}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-text-tertiary border-transparent hover:text-text-secondary hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>{renderForm(activeTab)}</div>
    </div>
  );
}
