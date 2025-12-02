import { useState, useEffect } from 'react';
import { systemConfigService } from '../services/system-config.service';
import { IconTrash, IconPlus } from './ui/Icons';

export default function SystemBehaviorRules() {
  const [rules, setRules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await systemConfigService.getBehaviorRules();
      setRules(data.rules || []);
    } catch (err) {
      const error = err as { message?: string; status?: number };
      if (error?.status === 404) {
        // No rules set yet, start with empty array
        setRules([]);
      } else {
        setError(error?.message || 'Failed to load behavior rules');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await systemConfigService.updateBehaviorRules(rules);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const error = err as { message?: string };
      setError(error?.message || 'Failed to save behavior rules');
    } finally {
      setSaving(false);
    }
  };

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
        <div className="text-text-secondary">Loading behavior rules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-secondary mb-2">
          System Behavior Rules
        </h2>
        <p className="text-text-tertiary text-sm">
          These rules apply to all agents and cannot be overridden by
          agent-specific rules. System rules are always included first in the
          conversation context.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
          Behavior rules saved successfully!
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Behavior Rules
        </label>
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={rule}
                onChange={(e) => handleRuleChange(index, e.target.value)}
                className="flex-1 h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background focus:outline-none focus:border-border-focus"
                placeholder={`Rule ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => handleRemoveRule(index)}
                className="h-8 w-8 flex items-center justify-center text-text-tertiary hover:text-red-600 hover:bg-background-tertiary rounded transition-colors flex-shrink-0"
                title="Remove rule"
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
            <span>Add Rule</span>
          </button>
        </div>
        <p className="text-xs text-text-tertiary mt-2">
          Rules will be saved as a JSON array and applied to all bots
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary text-text-inverse rounded-md text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Rules'}
        </button>
      </div>
    </div>
  );
}
