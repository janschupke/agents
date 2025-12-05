import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Select, ChipSelector, Slider } from '@openai/ui';
import {
  ResponseLength,
  Gender,
  Sentiment,
  Availability,
} from '../../../types/agent.types';
import {
  PersonalityType,
  PERSONALITY_TYPES,
  INTERESTS,
} from '@openai/shared-types';
import { ChangeEvent } from 'react';

interface PersonalitySectionProps {
  formValues: {
    responseLength: ResponseLength | '';
    age: string;
    gender: Gender | '';
    personality: PersonalityType | '';
    sentiment: Sentiment | '';
    availability: Availability | '';
    interests: string[];
  };
  errors: Record<string, string>;
  isArchetype: boolean;
  onFieldChange: (field: string, value: string | string[]) => void;
}

export default function PersonalitySection({
  formValues,
  errors,
  isArchetype,
  onFieldChange,
}: PersonalitySectionProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  return (
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
          <Select
            value={formValues.responseLength}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onFieldChange('responseLength', e.target.value)
            }
          >
            <option value="">
              {isArchetype
                ? t('archetypes.form.selectResponseLength')
                : 'Select response length'}
            </option>
            <option value={ResponseLength.SHORT}>{ResponseLength.SHORT}</option>
            <option value={ResponseLength.STANDARD}>
              {ResponseLength.STANDARD}
            </option>
            <option value={ResponseLength.LONG}>{ResponseLength.LONG}</option>
            <option value={ResponseLength.ADAPT}>{ResponseLength.ADAPT}</option>
          </Select>
        </div>

        <Slider
          id="agent-age"
          value={formValues.age ? parseInt(formValues.age, 10) : 25}
          onChange={(val) => onFieldChange('age', val.toString())}
          min={0}
          max={100}
          step={1}
          label={isArchetype ? t('archetypes.form.age') : 'Age'}
          error={errors.age}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {isArchetype ? t('archetypes.form.gender') : 'Gender'}
          </label>
          <Select
            value={formValues.gender}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onFieldChange('gender', e.target.value)
            }
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
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {isArchetype ? t('archetypes.form.personality') : 'Personality'}
          </label>
          <Select
            value={formValues.personality}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onFieldChange('personality', e.target.value)
            }
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
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {isArchetype ? t('archetypes.form.sentiment') : 'Sentiment'}
          </label>
          <Select
            value={formValues.sentiment}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onFieldChange('sentiment', e.target.value)
            }
          >
            <option value="">
              {isArchetype
                ? t('archetypes.form.selectSentiment')
                : 'Select sentiment'}
            </option>
            <option value={Sentiment.NEUTRAL}>{Sentiment.NEUTRAL}</option>
            <option value={Sentiment.ENGAGED}>{Sentiment.ENGAGED}</option>
            <option value={Sentiment.FRIENDLY}>{Sentiment.FRIENDLY}</option>
            <option value={Sentiment.ATTRACTED}>{Sentiment.ATTRACTED}</option>
            <option value={Sentiment.OBSESSED}>{Sentiment.OBSESSED}</option>
            <option value={Sentiment.DISINTERESTED}>
              {Sentiment.DISINTERESTED}
            </option>
            <option value={Sentiment.ANGRY}>{Sentiment.ANGRY}</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            {isArchetype ? t('archetypes.form.availability') : 'Availability'}
          </label>
          <Select
            value={formValues.availability}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onFieldChange('availability', e.target.value)
            }
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
          </Select>
        </div>
      </div>

      <ChipSelector
        id="agent-interests"
        options={[...INTERESTS]}
        selected={formValues.interests}
        onChange={(interests) => onFieldChange('interests', interests)}
        label={isArchetype ? t('archetypes.form.interests') : 'Interests'}
      />
    </div>
  );
}
