import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Input, Textarea, Select, AvatarInput, FormField } from '@openai/ui';
import { AgentType } from '../../../types/agent.types';
import { ChangeEvent } from 'react';

interface BasicInfoSectionProps {
  formValues: {
    name: string;
    description: string;
    avatarUrl: string;
    agentType: AgentType | '';
    language: string;
  };
  errors: Record<string, string>;
  isArchetype: boolean;
  onFieldChange: (field: string, value: string) => void;
}

export default function BasicInfoSection({
  formValues,
  errors,
  isArchetype,
  onFieldChange,
}: BasicInfoSectionProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-text-secondary">
        {isArchetype
          ? t('archetypes.form.basicInfo')
          : t('agents.detail.basicInfo')}
      </h4>

      <FormField
        label={
          <>
            {isArchetype ? t('archetypes.form.name') : t('agents.edit.name')}{' '}
            <span className="text-red-500">*</span>
          </>
        }
        labelFor="agent-name"
        error={errors.name}
      >
        <Input
          id="agent-name"
          type="text"
          value={formValues.name}
          onChange={(e) => onFieldChange('name', e.target.value)}
          required
        />
      </FormField>

      <FormField
        label={
          isArchetype
            ? t('archetypes.form.description')
            : t('agents.edit.description')
        }
        labelFor="agent-description"
      >
        <Textarea
          id="agent-description"
          value={formValues.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          rows={3}
        />
      </FormField>

      <AvatarInput
        value={formValues.avatarUrl || null}
        onChange={(url) => onFieldChange('avatarUrl', url || '')}
        label={
          isArchetype
            ? t('archetypes.form.avatarUrl')
            : t('agents.edit.avatarUrl')
        }
        allowUrlInput={true}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {isArchetype
              ? t('archetypes.form.agentType')
              : t('agents.edit.agentType')}
          </label>
          <Select
            value={formValues.agentType}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onFieldChange('agentType', e.target.value)
            }
          >
            <option value="">
              {isArchetype
                ? t('archetypes.form.selectAgentType')
                : 'Select agent type'}
            </option>
            <option value={AgentType.GENERAL}>{AgentType.GENERAL}</option>
            <option value={AgentType.LANGUAGE_ASSISTANT}>
              {AgentType.LANGUAGE_ASSISTANT}
            </option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {isArchetype
              ? t('archetypes.form.language')
              : t('agents.edit.language')}
          </label>
          <Input
            type="text"
            value={formValues.language}
            onChange={(e) => onFieldChange('language', e.target.value)}
            placeholder="en, zh, ja, etc."
          />
        </div>
      </div>
    </div>
  );
}
