import { ChipSelector } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { INTERESTS } from '@openai/shared-types';

interface InterestsDashboardProps {
  selectedInterests: string[];
  onChange: (interests: string[]) => void;
}

export default function InterestsDashboard({
  selectedInterests,
  onChange,
}: InterestsDashboardProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <ChipSelector
      id="agent-interests"
      options={[...INTERESTS]}
      selected={selectedInterests}
      onChange={onChange}
      label={t('config.interests')}
      hint={t('config.interestsDescription')}
      maxSelections={5}
      size="md"
    />
  );
}
