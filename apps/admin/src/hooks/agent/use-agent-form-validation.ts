import { useState } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface FormValues {
  name: string;
  temperature: string;
  age: string;
  maxTokens: string;
}

interface UseAgentFormValidationProps {
  isArchetype: boolean;
}

export function useAgentFormValidation({
  isArchetype,
}: UseAgentFormValidationProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (formValues: FormValues): boolean => {
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

  return { validate, errors, setErrors };
}
