import { useState, useEffect } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
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
  const [success, setSuccess] = useState(false);

  // Sync rules from query data
  useEffect(() => {
    if (data) {
      setRules(data.rules || []);
    } else if (data === undefined && !loading) {
      // No rules set yet (404 case)
      setRules([]);
    }
  }, [data, loading]);

  // Show success message after successful save
  useEffect(() => {
    if (updateMutation.isSuccess) {
      setSuccess(true);
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [updateMutation.isSuccess]);

  const handleSave = async () => {
    updateMutation.mutate(rules, {
      onError: () => {
        // Error is handled by mutation state
      },
    });
  };

  const error =
    queryError && typeof queryError === 'object' && 'status' in queryError
      ? queryError.status === 404
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
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
          {tAdmin('systemRules.saved')}
        </div>
      )}

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
              <button
                type="button"
                onClick={() => handleRemoveRule(index)}
                className="h-8 w-8 flex items-center justify-center text-text-tertiary hover:text-red-600 hover:bg-background-tertiary rounded transition-colors flex-shrink-0"
                title={tAdmin('systemRules.removeRule')}
              >
                <IconTrash className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddRule}
            className="w-full h-8 px-3 bg-background border border-border rounded-md text-sm text-text-primary hover:bg-background-tertiary transition-colors flex items-center justify-center gap-1.5"
          >
            <IconPlus className="w-4 h-4" />
            <span>{tAdmin('systemRules.addRule')}</span>
          </button>
        </div>
        <p className="text-xs text-text-tertiary mt-2">
          {tAdmin('systemRules.placeholder')}
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="px-4 py-2 bg-primary text-text-inverse rounded-md text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateMutation.isPending
            ? tCommon('app.saving')
            : tAdmin('systemRules.save')}
        </button>
      </div>
    </div>
  );
}
