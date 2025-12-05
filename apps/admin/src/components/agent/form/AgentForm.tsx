import { useState, useEffect } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Button } from '@openai/ui';
import { AgentFormMode, AgentFormData } from '../../../types/agent-form.types';
import { useAgentFormValidation } from '../../../hooks/agent';
import {
  BasicInfoSection,
  ConfigurationSection,
  BehaviorRulesSection,
  PersonalitySection,
} from './index';
import {
  AgentType,
  ResponseLength,
  Gender,
  Sentiment,
  Availability,
} from '../../../types/agent.types';
import { PersonalityType } from '@openai/shared-types';

export interface AgentFormProps {
  mode: AgentFormMode;
  initialData?: AgentFormData | null;
  onSubmit: (data: AgentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormValues {
  name: string;
  description: string;
  avatarUrl: string;
  agentType: AgentType | '';
  language: string;
  temperature: string;
  systemPrompt: string;
  behaviorRules: string[];
  model: string;
  maxTokens: string;
  responseLength: ResponseLength | '';
  age: string;
  gender: Gender | '';
  personality: PersonalityType | '';
  sentiment: Sentiment | '';
  interests: string[];
  availability: Availability | '';
}

export default function AgentForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: AgentFormProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const isArchetype = mode === AgentFormMode.ARCHETYPE;

  const [formValues, setFormValues] = useState<FormValues>({
    name: '',
    description: '',
    avatarUrl: '',
    agentType: '',
    language: '',
    temperature: '',
    systemPrompt: '',
    behaviorRules: [],
    model: '',
    maxTokens: '',
    responseLength: '',
    age: '',
    gender: '',
    personality: '',
    sentiment: '',
    interests: [],
    availability: '',
  });

  const [newBehaviorRule, setNewBehaviorRule] = useState('');

  const { validate, errors } = useAgentFormValidation({
    isArchetype,
  });

  useEffect(() => {
    if (initialData) {
      setFormValues({
        name: initialData.name || '',
        description: initialData.description || '',
        avatarUrl: initialData.avatarUrl || '',
        agentType: initialData.agentType || '',
        language: initialData.language || '',
        temperature: initialData.temperature?.toString() || '',
        systemPrompt: initialData.systemPrompt || '',
        behaviorRules: initialData.behaviorRules || [],
        model: initialData.model || '',
        maxTokens: initialData.maxTokens?.toString() || '',
        responseLength: initialData.responseLength || '',
        age: initialData.age?.toString() || '',
        gender: initialData.gender || '',
        personality: initialData.personality || '',
        sentiment: initialData.sentiment || '',
        interests: initialData.interests || [],
        availability: initialData.availability || '',
      });
    }
  }, [initialData]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !validate({
        name: formValues.name,
        temperature: formValues.temperature,
        age: formValues.age,
        maxTokens: formValues.maxTokens,
      })
    ) {
      return;
    }

    const configs: Record<string, unknown> = {};

    if (formValues.temperature) {
      configs.temperature = Number(formValues.temperature);
    }
    if (formValues.systemPrompt) {
      configs.system_prompt = formValues.systemPrompt;
    }
    if (isArchetype && formValues.behaviorRules.length > 0) {
      configs.behavior_rules = formValues.behaviorRules;
    }
    if (formValues.model) {
      configs.model = formValues.model;
    }
    if (formValues.maxTokens) {
      configs.max_tokens = Number(formValues.maxTokens);
    }
    if (formValues.responseLength) {
      configs.response_length = formValues.responseLength;
    }
    if (formValues.age) {
      configs.age = Number(formValues.age);
    }
    if (formValues.gender) {
      configs.gender = formValues.gender;
    }
    if (formValues.personality) {
      configs.personality = formValues.personality;
    }
    if (formValues.sentiment) {
      configs.sentiment = formValues.sentiment;
    }
    if (formValues.interests.length > 0) {
      configs.interests = formValues.interests;
    }
    if (formValues.availability) {
      configs.availability = formValues.availability;
    }

    const data: AgentFormData = {
      name: formValues.name.trim(),
      description: formValues.description.trim() || undefined,
      avatarUrl: formValues.avatarUrl.trim() || undefined,
      agentType: formValues.agentType || undefined,
      language: formValues.language.trim() || undefined,
      temperature: formValues.temperature
        ? Number(formValues.temperature)
        : undefined,
      systemPrompt: formValues.systemPrompt || undefined,
      behaviorRules: isArchetype ? formValues.behaviorRules : undefined,
      model: formValues.model || undefined,
      maxTokens: formValues.maxTokens
        ? Number(formValues.maxTokens)
        : undefined,
      responseLength: formValues.responseLength || undefined,
      age: formValues.age ? Number(formValues.age) : undefined,
      gender: formValues.gender || undefined,
      personality: formValues.personality || undefined,
      sentiment: formValues.sentiment || undefined,
      interests:
        formValues.interests.length > 0 ? formValues.interests : undefined,
      availability: formValues.availability || undefined,
    };

    await onSubmit(data);
  };

  const addBehaviorRule = () => {
    if (newBehaviorRule.trim()) {
      setFormValues({
        ...formValues,
        behaviorRules: [...formValues.behaviorRules, newBehaviorRule.trim()],
      });
      setNewBehaviorRule('');
    }
  };

  const removeBehaviorRule = (index: number) => {
    setFormValues({
      ...formValues,
      behaviorRules: formValues.behaviorRules.filter((_, i) => i !== index),
    });
  };

  const toggleInterest = (interest: string) => {
    setFormValues({
      ...formValues,
      interests: formValues.interests.includes(interest)
        ? formValues.interests.filter((i) => i !== interest)
        : [...formValues.interests, interest],
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-background-secondary rounded-lg p-6 border border-border"
    >
      <h3 className="text-lg font-semibold text-text-primary mb-6">
        {isArchetype
          ? initialData
            ? t('archetypes.edit')
            : t('archetypes.create')
          : t('agents.edit.title')}
      </h3>

      <div className="space-y-6">
        {/* Basic Info */}
        <BasicInfoSection
          formValues={{
            name: formValues.name,
            description: formValues.description,
            avatarUrl: formValues.avatarUrl,
            agentType: formValues.agentType,
            language: formValues.language,
          }}
          errors={errors}
          isArchetype={isArchetype}
          onFieldChange={(field: string, value: string) =>
            setFormValues({ ...formValues, [field]: value })
          }
        />

        {/* Configuration */}
        <ConfigurationSection
          formValues={{
            temperature: formValues.temperature,
            maxTokens: formValues.maxTokens,
            model: formValues.model,
            systemPrompt: formValues.systemPrompt,
          }}
          errors={errors}
          isArchetype={isArchetype}
          onFieldChange={(field: string, value: string) =>
            setFormValues({ ...formValues, [field]: value })
          }
        />

        {isArchetype && (
          <BehaviorRulesSection
            behaviorRules={formValues.behaviorRules}
            newBehaviorRule={newBehaviorRule}
            onNewRuleChange={setNewBehaviorRule}
            onAddRule={addBehaviorRule}
            onRemoveRule={removeBehaviorRule}
          />
        )}

        {/* Personality & Behavior */}
        <PersonalitySection
          formValues={{
            responseLength: formValues.responseLength,
            age: formValues.age,
            gender: formValues.gender,
            personality: formValues.personality,
            sentiment: formValues.sentiment,
            availability: formValues.availability,
            interests: formValues.interests,
          }}
          errors={errors}
          isArchetype={isArchetype}
          onFieldChange={(field: string, value: string | string[]) =>
            setFormValues({ ...formValues, [field]: value })
          }
          onToggleInterest={toggleInterest}
        />

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            size="sm"
          >
            {isLoading
              ? isArchetype
                ? t('archetypes.saving')
                : t('agents.edit.save')
              : isArchetype
                ? t('archetypes.save')
                : t('agents.edit.save')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            size="sm"
          >
            {isArchetype ? t('archetypes.cancel') : t('agents.edit.cancel')}
          </Button>
        </div>
      </div>
    </form>
  );
}
