import { useState, useEffect } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Button, Input, Textarea } from '@openai/ui';
import {
  AgentType,
  ResponseLength,
  Gender,
  Sentiment,
  Availability,
} from '../types/agent.types';
import {
  PersonalityType,
  PERSONALITY_TYPES,
  INTERESTS,
} from '@openai/shared-types';
import { AgentFormMode, AgentFormData } from '../types/agent-form.types';

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
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formValues.name.trim()) {
      newErrors.name = isArchetype
        ? t('archetypes.form.errors.nameRequired')
        : t('agents.edit.name') + ' is required';
    }

    if (
      formValues.temperature &&
      (Number(formValues.temperature) < 0 || Number(formValues.temperature) > 2)
    ) {
      newErrors.temperature = isArchetype
        ? t('archetypes.form.errors.temperatureRange')
        : 'Temperature must be between 0 and 2';
    }

    if (
      formValues.age &&
      (Number(formValues.age) < 0 || Number(formValues.age) > 100)
    ) {
      newErrors.age = isArchetype
        ? t('archetypes.form.errors.ageRange')
        : 'Age must be between 0 and 100';
    }

    if (formValues.maxTokens && Number(formValues.maxTokens) < 1) {
      newErrors.maxTokens = isArchetype
        ? t('archetypes.form.errors.maxTokensMin')
        : 'Max tokens must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
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
      temperature: formValues.temperature ? Number(formValues.temperature) : undefined,
      systemPrompt: formValues.systemPrompt || undefined,
      behaviorRules: isArchetype ? formValues.behaviorRules : undefined,
      model: formValues.model || undefined,
      maxTokens: formValues.maxTokens ? Number(formValues.maxTokens) : undefined,
      responseLength: formValues.responseLength || undefined,
      age: formValues.age ? Number(formValues.age) : undefined,
      gender: formValues.gender || undefined,
      personality: formValues.personality || undefined,
      sentiment: formValues.sentiment || undefined,
      interests: formValues.interests.length > 0 ? formValues.interests : undefined,
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
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-text-secondary">
            {isArchetype
              ? t('archetypes.form.basicInfo')
              : t('agents.detail.basicInfo')}
          </h4>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {isArchetype ? t('archetypes.form.name') : t('agents.edit.name')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formValues.name}
              onChange={(e) =>
                setFormValues({ ...formValues, name: e.target.value })
              }
              className={errors.name ? 'border-red-500' : ''}
              required
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {isArchetype
                ? t('archetypes.form.description')
                : t('agents.edit.description')}
            </label>
            <Textarea
              value={formValues.description}
              onChange={(e) =>
                setFormValues({ ...formValues, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {isArchetype
                ? t('archetypes.form.avatarUrl')
                : t('agents.edit.avatarUrl')}
            </label>
            <Input
              type="url"
              value={formValues.avatarUrl}
              onChange={(e) =>
                setFormValues({ ...formValues, avatarUrl: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {isArchetype
                  ? t('archetypes.form.agentType')
                  : t('agents.edit.agentType')}
              </label>
              <select
                value={formValues.agentType}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    agentType: e.target.value as AgentType | '',
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
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
              </select>
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
                onChange={(e) =>
                  setFormValues({ ...formValues, language: e.target.value })
                }
                placeholder="en, zh, ja, etc."
              />
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-text-secondary">
            {isArchetype
              ? t('archetypes.form.configuration')
              : 'Configuration'}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {isArchetype
                  ? t('archetypes.form.temperature')
                  : 'Temperature'}{' '}
                (0-2)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formValues.temperature}
                onChange={(e) =>
                  setFormValues({ ...formValues, temperature: e.target.value })
                }
                className={errors.temperature ? 'border-red-500' : ''}
              />
              {errors.temperature && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.temperature}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {isArchetype
                  ? t('archetypes.form.maxTokens')
                  : 'Max Tokens'}
              </label>
              <Input
                type="number"
                min="1"
                value={formValues.maxTokens}
                onChange={(e) =>
                  setFormValues({ ...formValues, maxTokens: e.target.value })
                }
                className={errors.maxTokens ? 'border-red-500' : ''}
              />
              {errors.maxTokens && (
                <p className="text-red-500 text-xs mt-1">{errors.maxTokens}</p>
              )}
            </div>
          </div>

          {isArchetype && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {t('archetypes.form.systemPrompt')}
              </label>
              <Textarea
                value={formValues.systemPrompt}
                onChange={(e) =>
                  setFormValues({ ...formValues, systemPrompt: e.target.value })
                }
                rows={4}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {isArchetype ? t('archetypes.form.model') : 'Model'}
            </label>
            <Input
              type="text"
              value={formValues.model}
              onChange={(e) =>
                setFormValues({ ...formValues, model: e.target.value })
              }
              placeholder="gpt-4, gpt-3.5-turbo, etc."
            />
          </div>

          {isArchetype && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {t('archetypes.form.behaviorRules')}
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newBehaviorRule}
                    onChange={(e) => setNewBehaviorRule(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addBehaviorRule();
                      }
                    }}
                    placeholder={t('archetypes.form.addRule')}
                  />
                  <Button type="button" onClick={addBehaviorRule} size="sm">
                    {t('archetypes.form.add')}
                  </Button>
                </div>
                {formValues.behaviorRules.length > 0 && (
                  <div className="space-y-1">
                    {formValues.behaviorRules.map((rule, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-background rounded border border-border"
                      >
                        <span className="flex-1 text-sm text-text-primary">
                          {rule}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBehaviorRule(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          {t('archetypes.form.remove')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Personality & Behavior */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-text-secondary">
            {isArchetype
              ? t('archetypes.form.personality')
              : 'Personality & Behavior'}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {isArchetype
                  ? t('archetypes.form.responseLength')
                  : 'Response Length'}
              </label>
              <select
                value={formValues.responseLength}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    responseLength: e.target.value as ResponseLength | '',
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              >
                <option value="">
                  {isArchetype
                    ? t('archetypes.form.selectResponseLength')
                    : 'Select response length'}
                </option>
                <option value={ResponseLength.SHORT}>
                  {ResponseLength.SHORT}
                </option>
                <option value={ResponseLength.STANDARD}>
                  {ResponseLength.STANDARD}
                </option>
                <option value={ResponseLength.LONG}>
                  {ResponseLength.LONG}
                </option>
                <option value={ResponseLength.ADAPT}>
                  {ResponseLength.ADAPT}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {isArchetype ? t('archetypes.form.age') : 'Age'} (0-100)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formValues.age}
                onChange={(e) =>
                  setFormValues({ ...formValues, age: e.target.value })
                }
                className={errors.age ? 'border-red-500' : ''}
              />
              {errors.age && (
                <p className="text-red-500 text-xs mt-1">{errors.age}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {isArchetype ? t('archetypes.form.gender') : 'Gender'}
              </label>
              <select
                value={formValues.gender}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    gender: e.target.value as Gender | '',
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              >
                <option value="">
                  {isArchetype
                    ? t('archetypes.form.selectGender')
                    : 'Select gender'}
                </option>
                <option value={Gender.MALE}>{Gender.MALE}</option>
                <option value={Gender.FEMALE}>{Gender.FEMALE}</option>
                <option value={Gender.NON_BINARY}>{Gender.NON_BINARY}</option>
                <option value={Gender.PREFER_NOT_TO_SAY}>
                  {Gender.PREFER_NOT_TO_SAY}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {isArchetype
                  ? t('archetypes.form.personality')
                  : 'Personality'}
              </label>
              <select
                value={formValues.personality}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    personality: e.target.value as PersonalityType | '',
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              >
                <option value="">
                  {isArchetype
                    ? t('archetypes.form.selectPersonality')
                    : 'Select personality'}
                </option>
                {PERSONALITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {isArchetype ? t('archetypes.form.sentiment') : 'Sentiment'}
              </label>
              <select
                value={formValues.sentiment}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    sentiment: e.target.value as Sentiment | '',
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              >
                <option value="">
                  {isArchetype
                    ? t('archetypes.form.selectSentiment')
                    : 'Select sentiment'}
                </option>
                <option value={Sentiment.NEUTRAL}>{Sentiment.NEUTRAL}</option>
                <option value={Sentiment.ENGAGED}>{Sentiment.ENGAGED}</option>
                <option value={Sentiment.FRIENDLY}>{Sentiment.FRIENDLY}</option>
                <option value={Sentiment.ATTRACTED}>
                  {Sentiment.ATTRACTED}
                </option>
                <option value={Sentiment.OBSESSED}>{Sentiment.OBSESSED}</option>
                <option value={Sentiment.DISINTERESTED}>
                  {Sentiment.DISINTERESTED}
                </option>
                <option value={Sentiment.ANGRY}>{Sentiment.ANGRY}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {isArchetype
                  ? t('archetypes.form.availability')
                  : 'Availability'}
              </label>
              <select
                value={formValues.availability}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    availability: e.target.value as Availability | '',
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              >
                <option value="">
                  {isArchetype
                    ? t('archetypes.form.selectAvailability')
                    : 'Select availability'}
                </option>
                <option value={Availability.AVAILABLE}>
                  {Availability.AVAILABLE}
                </option>
                <option value={Availability.STANDARD}>
                  {Availability.STANDARD}
                </option>
                <option value={Availability.BUSY}>{Availability.BUSY}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {isArchetype ? t('archetypes.form.interests') : 'Interests'}
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <Button
                  key={interest}
                  type="button"
                  variant={
                    formValues.interests.includes(interest)
                      ? 'primary'
                      : 'secondary'
                  }
                  size="xs"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Button>
              ))}
            </div>
          </div>
        </div>

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
