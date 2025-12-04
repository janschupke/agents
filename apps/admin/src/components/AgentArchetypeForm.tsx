import { useState, useEffect } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@openai/ui';
import { AgentArchetypeService } from '../services/agent-archetype.service';
import { AgentArchetype } from '../types/agent-archetype.types';
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

interface AgentArchetypeFormProps {
  archetype: AgentArchetype | null;
  onSave: () => void;
  onCancel: () => void;
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

export default function AgentArchetypeForm({
  archetype,
  onSave,
  onCancel,
}: AgentArchetypeFormProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const queryClient = useQueryClient();

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

  // Load archetype data when editing
  useEffect(() => {
    if (archetype) {
      const configs = archetype.configs || {};
      setFormValues({
        name: archetype.name || '',
        description: archetype.description || '',
        avatarUrl: archetype.avatarUrl || '',
        agentType: archetype.agentType || '',
        language: archetype.language || '',
        temperature: configs.temperature?.toString() || '',
        systemPrompt: (configs.system_prompt as string) || '',
        behaviorRules: Array.isArray(configs.behavior_rules)
          ? configs.behavior_rules
          : typeof configs.behavior_rules === 'object' &&
              'rules' in (configs.behavior_rules || {})
            ? (configs.behavior_rules as { rules: string[] })?.rules || []
            : [],
        model: (configs.model as string) || '',
        maxTokens: configs.max_tokens?.toString() || '',
        responseLength: (configs.response_length as ResponseLength) || '',
        age: configs.age?.toString() || '',
        gender: (configs.gender as Gender) || '',
        personality: (configs.personality as PersonalityType) || '',
        sentiment: (configs.sentiment as Sentiment) || '',
        interests: (configs.interests as string[]) || [],
        availability: (configs.availability as Availability) || '',
      });
    }
  }, [archetype]);

  const createMutation = useMutation({
    mutationFn: (
      data: Parameters<typeof AgentArchetypeService.createArchetype>[0]
    ) => AgentArchetypeService.createArchetype(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-archetypes'] });
      onSave();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof AgentArchetypeService.updateArchetype>[1];
    }) => AgentArchetypeService.updateArchetype(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-archetypes'] });
      onSave();
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formValues.name.trim()) {
      newErrors.name = t('archetypes.form.errors.nameRequired');
    }

    if (
      formValues.temperature &&
      (Number(formValues.temperature) < 0 || Number(formValues.temperature) > 2)
    ) {
      newErrors.temperature = t('archetypes.form.errors.temperatureRange');
    }

    if (
      formValues.age &&
      (Number(formValues.age) < 0 || Number(formValues.age) > 100)
    ) {
      newErrors.age = t('archetypes.form.errors.ageRange');
    }

    if (formValues.maxTokens && Number(formValues.maxTokens) < 1) {
      newErrors.maxTokens = t('archetypes.form.errors.maxTokensMin');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    if (formValues.behaviorRules.length > 0) {
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

    const data = {
      name: formValues.name.trim(),
      description: formValues.description.trim() || undefined,
      avatarUrl: formValues.avatarUrl.trim() || undefined,
      agentType: formValues.agentType || undefined,
      language: formValues.language.trim() || undefined,
      configs: Object.keys(configs).length > 0 ? configs : undefined,
    };

    if (archetype) {
      updateMutation.mutate({ id: archetype.id, data });
    } else {
      createMutation.mutate(data);
    }
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

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-background-secondary rounded-lg p-6 border border-border"
    >
      <h3 className="text-lg font-semibold text-text-primary mb-6">
        {archetype ? t('archetypes.edit') : t('archetypes.create')}
      </h3>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-text-secondary">
            {t('archetypes.form.basicInfo')}
          </h4>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {t('archetypes.form.name')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formValues.name}
              onChange={(e) =>
                setFormValues({ ...formValues, name: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md bg-background text-text-primary ${
                errors.name ? 'border-red-500' : 'border-border'
              }`}
              required
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {t('archetypes.form.description')}
            </label>
            <textarea
              value={formValues.description}
              onChange={(e) =>
                setFormValues({ ...formValues, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {t('archetypes.form.avatarUrl')}
            </label>
            <input
              type="url"
              value={formValues.avatarUrl}
              onChange={(e) =>
                setFormValues({ ...formValues, avatarUrl: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {t('archetypes.form.agentType')}
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
                <option value="">{t('archetypes.form.selectAgentType')}</option>
                <option value={AgentType.GENERAL}>{AgentType.GENERAL}</option>
                <option value={AgentType.LANGUAGE_ASSISTANT}>
                  {AgentType.LANGUAGE_ASSISTANT}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {t('archetypes.form.language')}
              </label>
              <input
                type="text"
                value={formValues.language}
                onChange={(e) =>
                  setFormValues({ ...formValues, language: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
                placeholder="en, zh, ja, etc."
              />
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-text-secondary">
            {t('archetypes.form.configuration')}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {t('archetypes.form.temperature')} (0-2)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formValues.temperature}
                onChange={(e) =>
                  setFormValues({ ...formValues, temperature: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md bg-background text-text-primary ${
                  errors.temperature ? 'border-red-500' : 'border-border'
                }`}
              />
              {errors.temperature && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.temperature}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {t('archetypes.form.maxTokens')}
              </label>
              <input
                type="number"
                min="1"
                value={formValues.maxTokens}
                onChange={(e) =>
                  setFormValues({ ...formValues, maxTokens: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md bg-background text-text-primary ${
                  errors.maxTokens ? 'border-red-500' : 'border-border'
                }`}
              />
              {errors.maxTokens && (
                <p className="text-red-500 text-xs mt-1">{errors.maxTokens}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {t('archetypes.form.systemPrompt')}
            </label>
            <textarea
              value={formValues.systemPrompt}
              onChange={(e) =>
                setFormValues({ ...formValues, systemPrompt: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {t('archetypes.form.model')}
            </label>
            <input
              type="text"
              value={formValues.model}
              onChange={(e) =>
                setFormValues({ ...formValues, model: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary"
              placeholder="gpt-4, gpt-3.5-turbo, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              {t('archetypes.form.behaviorRules')}
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBehaviorRule}
                  onChange={(e) => setNewBehaviorRule(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addBehaviorRule();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-text-primary"
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
        </div>

        {/* Personality & Behavior */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-text-secondary">
            {t('archetypes.form.personality')}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {t('archetypes.form.responseLength')}
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
                  {t('archetypes.form.selectResponseLength')}
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
                {t('archetypes.form.age')} (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formValues.age}
                onChange={(e) =>
                  setFormValues({ ...formValues, age: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md bg-background text-text-primary ${
                  errors.age ? 'border-red-500' : 'border-border'
                }`}
              />
              {errors.age && (
                <p className="text-red-500 text-xs mt-1">{errors.age}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                {t('archetypes.form.gender')}
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
                <option value="">{t('archetypes.form.selectGender')}</option>
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
                {t('archetypes.form.personality')}
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
                  {t('archetypes.form.selectPersonality')}
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
                {t('archetypes.form.sentiment')}
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
                <option value="">{t('archetypes.form.selectSentiment')}</option>
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
                {t('archetypes.form.availability')}
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
                  {t('archetypes.form.selectAvailability')}
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
              {t('archetypes.form.interests')}
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
            {isLoading ? t('archetypes.saving') : t('archetypes.save')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            size="sm"
          >
            {t('archetypes.cancel')}
          </Button>
        </div>
      </div>
    </form>
  );
}
