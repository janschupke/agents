import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Button, Tabs, BehaviorRulesEditor } from '@openai/ui';
import { AgentType } from '../../../types/agent.types';
import { useSystemRulesForm } from '../hooks/use-system-rules-form';
import { LoadingState } from '../../../components/shared';

type TabType = AgentType;

export default function SystemBehaviorRules() {
  const { t: tAdmin } = useTranslation(I18nNamespace.ADMIN);
  const { t: tCommon } = useTranslation(I18nNamespace.COMMON);

  const {
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
  } = useSystemRulesForm();

  if (isLoading) {
    return <LoadingState message={tAdmin('app.loading')} />;
  }

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: AgentType.GENERAL, label: tAdmin('systemRules.general') },
    { id: AgentType.LANGUAGE_ASSISTANT, label: AgentType.LANGUAGE_ASSISTANT },
  ];

  const renderForm = (tab: TabType) => {
    const currentFormData = formData[tab];
    const error = getError(tab);
    const systemPromptValidation = getSystemPromptErrors(tab);

    return (
      <div className="space-y-6">
        {error && (
          <div className="bg-message-error border border-border text-text-primary px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {tAdmin('systemRules.systemPromptLabel')}
          </label>
          <textarea
            value={currentFormData.systemPrompt}
            onChange={(e) => handleSystemPromptChange(tab, e.target.value)}
            onBlur={() => {
              // Trigger validation on blur
              if (tab === AgentType.GENERAL) {
                // Validation is handled in the hook
              }
            }}
            className={`w-full min-h-[120px] px-3 py-2 border rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus font-mono resize-y ${
              systemPromptValidation.touched && systemPromptValidation.error
                ? 'border-red-500'
                : 'border-border-input'
            }`}
            placeholder={tAdmin('systemRules.systemPromptPlaceholder')}
          />
          {systemPromptValidation.touched && systemPromptValidation.error && (
            <p className="text-xs text-red-600 mt-1">
              {systemPromptValidation.error}
            </p>
          )}
          <p className="text-xs text-text-tertiary mt-2">
            {tAdmin('systemRules.systemPromptDescription')}
          </p>
        </div>

        <BehaviorRulesEditor
          rules={currentFormData.rules}
          onChange={(rules) => handleRulesChange(tab, rules)}
          namespace={I18nNamespace.ADMIN}
          label={tAdmin('systemRules.label')}
        />

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

      <Tabs
        tabs={tabs.map((tab) => ({ id: tab.id, label: tab.label }))}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as AgentType)}
      >
        {activeTab === AgentType.GENERAL && (
          <div>{renderForm(AgentType.GENERAL)}</div>
        )}
        {activeTab === AgentType.LANGUAGE_ASSISTANT && (
          <div>{renderForm(AgentType.LANGUAGE_ASSISTANT)}</div>
        )}
      </Tabs>
    </div>
  );
}
