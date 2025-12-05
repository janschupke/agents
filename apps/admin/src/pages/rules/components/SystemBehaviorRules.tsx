import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Button, Tabs } from '@openai/ui';
import { IconTrash, IconPlus } from '../../../components/ui/Icons';
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
    handleRuleChange,
    handleAddRule,
    handleRemoveRule,
    handleSystemPromptChange,
    handleSave,
    getError,
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
            className="w-full min-h-[120px] px-3 py-2 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus font-mono resize-y"
            placeholder={tAdmin('systemRules.systemPromptPlaceholder')}
          />
          <p className="text-xs text-text-tertiary mt-2">
            {tAdmin('systemRules.systemPromptDescription')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {tAdmin('systemRules.label')}
          </label>
          <div className="space-y-2">
            {currentFormData.rules.map((rule: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => handleRuleChange(tab, index, e.target.value)}
                  className="flex-1 h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus"
                  placeholder={tAdmin('systemRules.rulePlaceholder', {
                    index: (index + 1).toString(),
                  })}
                />
                <Button
                  variant="icon"
                  size="sm"
                  onClick={() => handleRemoveRule(tab, index)}
                  className="text-text-tertiary hover:text-text-primary"
                >
                  <IconTrash className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAddRule(tab)}
            className="mt-2"
          >
            <IconPlus className="w-4 h-4" />
            {tAdmin('systemRules.addRule')}
          </Button>
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
