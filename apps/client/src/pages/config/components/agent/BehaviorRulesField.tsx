import { useState, useEffect, useMemo } from 'react';
import {
  IconTrash,
  IconPlus,
  IconSettings,
  IconEdit,
  FormField,
  Button,
  Input,
  Textarea,
  ButtonVariant,
  ButtonType,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { parseBehaviorRules } from '../../utils/agent.utils';

interface BehaviorRulesFieldProps {
  rules: string[];
  onChange: (rules: string[]) => void;
}

type ViewMode = 'form' | 'json';

export function BehaviorRulesField({
  rules,
  onChange,
}: BehaviorRulesFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const [viewMode, setViewMode] = useState<ViewMode>('form');
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Convert rules array to JSON string
  const rulesToJson = useMemo(() => {
    return JSON.stringify(rules, null, 2);
  }, [rules]);

  // Initialize JSON value when switching to JSON view or when rules change
  useEffect(() => {
    if (viewMode === 'json') {
      setJsonValue(rulesToJson);
      setJsonError(null);
    }
  }, [viewMode, rulesToJson]);

  // Validate and sync JSON when in JSON view
  const handleJsonChange = (value: string) => {
    setJsonValue(value);
    setJsonError(null);

    // Try to parse and validate JSON
    if (value.trim() === '') {
      // Empty JSON is valid (empty array)
      onChange([]);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      // Use parseBehaviorRules to validate the format
      const parsedRules = parseBehaviorRules(parsed);
      // If valid, update the rules
      onChange(parsedRules);
    } catch (error) {
      // Invalid JSON - show error but don't update rules
      setJsonError(
        error instanceof Error
          ? error.message
          : t('config.jsonInvalidError', {
              defaultValue: 'Invalid JSON format',
            })
      );
    }
  };

  // Handle view mode switch
  const handleViewModeSwitch = (newMode: ViewMode) => {
    if (newMode === 'json') {
      // Switching to JSON view - format current rules
      setJsonValue(rulesToJson);
      setJsonError(null);
    }
    // If switching from JSON to form, the rules are already synced (if valid)
    setViewMode(newMode);
  };

  return (
    <FormField
      label={
        <div className="flex items-center justify-between w-full">
          <span>{t('config.behaviorRules')}</span>
          <div className="flex gap-2">
            <Button
              type={ButtonType.BUTTON}
              onClick={() => handleViewModeSwitch('form')}
              variant={
                viewMode === 'form'
                  ? ButtonVariant.PRIMARY
                  : ButtonVariant.SECONDARY
              }
              size="sm"
              className="text-xs"
            >
              <IconEdit className="w-3.5 h-3.5 mr-1" />
              {t('config.viewForm', { defaultValue: 'Form' })}
            </Button>
            <Button
              type={ButtonType.BUTTON}
              onClick={() => handleViewModeSwitch('json')}
              variant={
                viewMode === 'json'
                  ? ButtonVariant.PRIMARY
                  : ButtonVariant.SECONDARY
              }
              size="sm"
              className="text-xs"
            >
              <IconSettings className="w-3.5 h-3.5 mr-1" />
              {t('config.viewJson', { defaultValue: 'JSON' })}
            </Button>
          </div>
        </div>
      }
      hint={t('config.rulesDescription')}
      error={viewMode === 'json' ? jsonError : undefined}
      touched={viewMode === 'json' && jsonError !== null}
    >
      {viewMode === 'form' ? (
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="text"
                value={rule}
                onChange={(e) => {
                  const newRules = [...rules];
                  newRules[index] = e.target.value;
                  onChange(newRules);
                }}
                className="flex-1"
                placeholder={t('config.rulePlaceholder', {
                  index: (index + 1).toString(),
                })}
              />
              <Button
                type={ButtonType.BUTTON}
                onClick={() => {
                  const newRules = rules.filter((_, i) => i !== index);
                  onChange(newRules);
                }}
                variant={ButtonVariant.ICON}
                size="sm"
                className="w-8 p-0"
                tooltip={t('config.removeRule')}
              >
                <IconTrash className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type={ButtonType.BUTTON}
            onClick={() => onChange([...rules, ''])}
            variant={ButtonVariant.SECONDARY}
            size="sm"
            className="w-full"
          >
            <IconPlus className="w-4 h-4" />
            <span>{t('config.addRule')}</span>
          </Button>
        </div>
      ) : (
        <Textarea
          value={jsonValue}
          onChange={(e) => handleJsonChange(e.target.value)}
          rows={8}
          className="font-mono text-sm"
          placeholder={t('config.jsonPlaceholder', {
            defaultValue: '["Rule 1", "Rule 2", "Rule 3"]',
          })}
        />
      )}
    </FormField>
  );
}
