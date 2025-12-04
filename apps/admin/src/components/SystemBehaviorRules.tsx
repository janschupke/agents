import { useState, useEffect } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { NUMERIC_CONSTANTS, HTTP_STATUS } from '@openai/shared-types';
import { Button } from '@openai/ui';
import {
  useSystemRules,
  useUpdateSystemRules,
} from '../hooks/queries/use-system-rules';
import { IconTrash, IconPlus } from './ui/Icons';

export default function SystemBehaviorRules() {
  const { t: tAdmin } = useTranslation(I18nNamespace.ADMIN);
  const { t: tCommon } = useTranslation(I18nNamespace.COMMON);
  const { data, isLoading: loading, error: queryError } = useSystemRules();
  const updateMutation = useUpdateSystemRules();
  const [rules, setRules] = useState<string[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // Sync rules and system prompt from query data
  useEffect(() => {
    if (data) {
      setRules(data.rules || []);
      setSystemPrompt(data.system_prompt || '');
    } else if (data === undefined && !loading) {
      // No rules set yet (404 case)
      setRules([]);
      setSystemPrompt('');
    }
  }, [data, loading]);

  // Show success message after successful save
  useEffect(() => {
    if (updateMutation.isSuccess) {
      setSuccess(true);
      const timer = setTimeout(
        () => setSuccess(false),
        NUMERIC_CONSTANTS.UI_NOTIFICATION_DURATION
      );
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [updateMutation.isSuccess]);

  const handleSave = async () => {
    updateMutation.mutate(
      { rules, systemPrompt: systemPrompt.trim() || undefined },
      {
        onError: () => {
          // Error is handled by mutation state
        },
      }
    );
  };

  const error =
    queryError && typeof queryError === 'object' && 'status' in queryError
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

  const handleAddRule = () => {
    setRules([...rules, '']);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index] = value;
    setRules(newRules);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-text-secondary">{tAdmin('app.loading')}</div>
      </div>
    );
  }

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

      {error && (
        <div className="bg-message-error border border-border text-text-primary px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-message-success border border-border text-text-primary px-4 py-3 rounded-md text-sm">
          {tAdmin('systemRules.saved')}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {tAdmin('systemRules.systemPromptLabel') || 'Authoritative System Prompt'}
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="w-full min-h-[120px] px-3 py-2 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus font-mono resize-y"
          placeholder={tAdmin('systemRules.systemPromptPlaceholder') || 'Enter the authoritative system prompt that will be sent as the first message in every chat request...'}
        />
        <p className="text-xs text-text-tertiary mt-2">
          {tAdmin('systemRules.systemPromptDescription') || 'This system prompt will be sent as the first SYSTEM role message in every chat request. It is the authoritative system prompt for all agents.'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {tAdmin('systemRules.label')}
        </label>
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={rule}
                onChange={(e) => handleRuleChange(index, e.target.value)}
                className="flex-1 h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus"
                placeholder={tAdmin('systemRules.rulePlaceholder', {
                  index: (index + 1).toString(),
                })}
              />
              <Button
                type="button"
                variant="icon"
                size="sm"
                onClick={() => handleRemoveRule(index)}
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
            onClick={handleAddRule}
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
          onClick={handleSave}
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
}
