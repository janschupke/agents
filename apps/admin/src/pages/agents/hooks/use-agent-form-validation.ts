import { useState } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { ValidationSchema, validateField } from '@openai/utils';

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

  // Create validation schema using centralized validation patterns
  const validationSchema: ValidationSchema<FormValues> = {
    name: [
      {
        validate: (value: string) => {
          if (!value || typeof value !== 'string') return false;
          return value.trim().length > 0;
        },
        message: isArchetype
          ? t('archetypes.form.errors.nameRequired')
          : t('agents.edit.name') + ' is required',
      },
    ],
    temperature: [
      {
        validate: (value: string) => {
          if (!value || value.trim() === '') return true; // Optional
          const numValue = Number(value);
          if (isNaN(numValue)) return false;
          return numValue >= 0 && numValue <= 2;
        },
        message: isArchetype
          ? t('archetypes.form.errors.temperatureRange')
          : 'Temperature must be between 0 and 2',
      },
    ],
    age: [
      {
        validate: (value: string) => {
          if (!value || value.trim() === '') return true; // Optional
          const numValue = Number(value);
          if (isNaN(numValue)) return false;
          return numValue >= 6 && numValue <= 100;
        },
        message: isArchetype
          ? t('archetypes.form.errors.ageRange')
          : 'Age must be between 6 and 100',
      },
    ],
    maxTokens: [
      {
        validate: (value: string) => {
          if (!value || value.trim() === '') return true; // Optional
          const numValue = Number(value);
          if (isNaN(numValue)) return false;
          return numValue >= 1;
        },
        message: isArchetype
          ? t('archetypes.form.errors.maxTokensMin')
          : 'Max tokens must be at least 1',
      },
    ],
  };

  const validate = (formValues: FormValues): boolean => {
    const newErrors: Record<string, string> = {};

    // Use centralized validateField utility
    const nameError = validateField(formValues.name, validationSchema.name);
    if (nameError) {
      newErrors.name = nameError;
    }

    if (formValues.temperature) {
      const tempError = validateField(
        formValues.temperature,
        validationSchema.temperature
      );
      if (tempError) {
        newErrors.temperature = tempError;
      }
    }

    if (formValues.age) {
      const ageError = validateField(formValues.age, validationSchema.age);
      if (ageError) {
        newErrors.age = ageError;
      }
    }

    if (formValues.maxTokens) {
      const maxTokensError = validateField(
        formValues.maxTokens,
        validationSchema.maxTokens
      );
      if (maxTokensError) {
        newErrors.maxTokens = maxTokensError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { validate, errors, setErrors };
}
