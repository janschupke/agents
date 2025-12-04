import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { INTERESTS, Interest } from '@openai/shared-types';

interface InterestsDashboardProps {
  selectedInterests: string[];
  onChange: (interests: string[]) => void;
}

export default function InterestsDashboard({
  selectedInterests,
  onChange,
}: InterestsDashboardProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  const toggleInterest = (interest: Interest) => {
    if (selectedInterests.includes(interest)) {
      onChange(selectedInterests.filter((i) => i !== interest));
    } else {
      onChange([...selectedInterests, interest]);
    }
  };

  return (
    <FormField
      label={t('config.interests')}
      labelFor="agent-interests"
      hint={t('config.interestsDescription')}
    >
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
        {INTERESTS.map((interest) => {
          const isSelected = selectedInterests.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                isSelected
                  ? 'bg-primary text-text-inverse border-primary'
                  : 'bg-background-secondary text-text-primary border-border hover:border-border-focus'
              }`}
            >
              {interest}
            </button>
          );
        })}
      </div>
    </FormField>
  );
}
