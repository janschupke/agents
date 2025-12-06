import { useState, useEffect, useMemo } from 'react';
import { IconTrash, IconPlus, IconSettings, IconEdit } from '../../Icons';
import FormField from '../FormField';
import Button from '../Button';
import Input from '../Input';
import Textarea from '../Textarea';
import FadeTransition from '../../animation/FadeTransition';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { parseBehaviorRules } from '@openai/utils';

export interface BehaviorRulesEditorProps {
  rules: string[];
  onChange: (rules: string[]) => void;
  namespace?: I18nNamespace;
  label?: string;
  hint?: string;
}

enum ViewMode {
  FORM = 'form',
  JSON = 'json',
}

export function BehaviorRulesEditor({
  rules,
  onChange,
  namespace = I18nNamespace.CLIENT,
  label,
  hint,
}: BehaviorRulesEditorProps) {
  const { t } = useTranslation(namespace);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.FORM);
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Convert rules array to JSON string
  const rulesToJson = useMemo(() => {
    return JSON.stringify(rules, null, 2);
  }, [rules]);

  // Initialize JSON value when switching to JSON view or when rules change
  useEffect(() => {
    if (viewMode === ViewMode.JSON) {
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
    if (newMode === ViewMode.JSON) {
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
        label ? (
          <div className="flex items-center justify-between w-full">
            <span>{label}</span>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => handleViewModeSwitch(ViewMode.FORM)}
                variant={viewMode === ViewMode.FORM ? 'primary' : 'secondary'}
                size="sm"
                className="text-xs"
              >
                <IconEdit size="sm" />
                {t('config.viewForm', { defaultValue: 'Form' })}
              </Button>
              <Button
                type="button"
                onClick={() => handleViewModeSwitch(ViewMode.JSON)}
                variant={viewMode === ViewMode.JSON ? 'primary' : 'secondary'}
                size="sm"
                className="text-xs"
              >
                <IconSettings size="sm" />
                {t('config.viewJson', { defaultValue: 'JSON' })}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span>{t('config.behaviorRules')}</span>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => handleViewModeSwitch(ViewMode.FORM)}
                variant={viewMode === ViewMode.FORM ? 'primary' : 'secondary'}
                size="sm"
                className="text-xs"
              >
                <IconEdit size="sm" />
                {t('config.viewForm', { defaultValue: 'Form' })}
              </Button>
              <Button
                type="button"
                onClick={() => handleViewModeSwitch(ViewMode.JSON)}
                variant={viewMode === ViewMode.JSON ? 'primary' : 'secondary'}
                size="sm"
                className="text-xs"
              >
                <IconSettings size="sm" />
                {t('config.viewJson', { defaultValue: 'JSON' })}
              </Button>
            </div>
          </div>
        )
      }
      hint={hint || t('config.rulesDescription')}
      error={viewMode === ViewMode.JSON ? jsonError : undefined}
      touched={viewMode === ViewMode.JSON && jsonError !== null}
    >
      <FadeTransition show={viewMode === ViewMode.FORM}>
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="text"
                value={rule}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const newRules = [...rules];
                  newRules[index] = e.target.value;
                  onChange(newRules);
                }}
                className="flex-1"
                size="md"
                placeholder={t('config.rulePlaceholder', {
                  index: (index + 1).toString(),
                })}
              />
              <Button
                type="button"
                onClick={() => {
                  const newRules = rules.filter((_, i) => i !== index);
                  onChange(newRules);
                }}
                variant="icon"
                size="sm"
                className="w-8 p-0"
                tooltip={t('config.removeRule')}
              >
                <IconTrash size="sm" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            onClick={() => onChange([...rules, ''])}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            <IconPlus size="sm" />
            <span>{t('config.addRule')}</span>
          </Button>
        </div>
      </FadeTransition>
      <FadeTransition show={viewMode === ViewMode.JSON}>
        <Textarea
          value={jsonValue}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleJsonChange(e.target.value)}
          rows={8}
          className="font-mono text-sm"
          placeholder={t('config.jsonPlaceholder', {
            defaultValue: '["Rule 1", "Rule 2", "Rule 3"]',
          })}
        />
      </FadeTransition>
    </FormField>
  );
}
