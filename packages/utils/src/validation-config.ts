import { ValidationSchema, validationRules } from './validation';

/**
 * Common validation schemas for forms across the application
 * These can be imported and used directly or extended for specific use cases
 */

/**
 * Agent form validation schema
 */
export const agentFormValidationSchema: ValidationSchema<{
  name: string;
  description?: string;
  avatarUrl?: string;
  temperature?: number | string;
  age?: number | string;
  maxTokens?: number | string;
}> = {
  name: [validationRules.required('Agent name is required')],
  description: [
    {
      validate: (value: string | undefined) => {
        if (!value) return true; // Optional
        return value.length <= 5000;
      },
      message: 'Description must be no more than 5000 characters',
    },
  ],
  avatarUrl: [
    // Only validate URL if provided (optional field)
    {
      validate: (value: string | undefined) => {
        if (!value || value.trim() === '') return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Avatar URL must be a valid URL',
    },
  ],
  temperature: [
    {
      validate: (value: number | string | undefined) => {
        if (value === undefined || value === null || value === '') return true; // Optional
        const numValue = typeof value === 'string' ? Number(value) : value;
        if (isNaN(numValue)) return false;
        return numValue >= 0 && numValue <= 2;
      },
      message: 'Temperature must be between 0 and 2',
    },
  ],
  age: [
    {
      validate: (value: number | string | undefined) => {
        if (value === undefined || value === null || value === '') return true; // Optional
        const numValue = typeof value === 'string' ? Number(value) : value;
        if (isNaN(numValue)) return false;
        return numValue >= 6 && numValue <= 100;
      },
      message: 'Age must be between 6 and 100',
    },
  ],
  maxTokens: [
    {
      validate: (value: number | string | undefined) => {
        if (value === undefined || value === null || value === '') return true; // Optional
        const numValue = typeof value === 'string' ? Number(value) : value;
        if (isNaN(numValue)) return false;
        return numValue >= 1;
      },
      message: 'Max tokens must be at least 1',
    },
  ],
};

/**
 * API key form validation schema
 */
export const apiKeyFormValidationSchema: ValidationSchema<{
  apiKey: string;
}> = {
  apiKey: [validationRules.required('API key is required')],
};

/**
 * Saved word form validation schema
 */
export const savedWordFormValidationSchema: ValidationSchema<{
  translation: string;
  pinyin?: string;
}> = {
  translation: [
    validationRules.required('Translation is required'),
    validationRules.maxLength(500, 'Translation must be no more than 500 characters'),
  ],
  pinyin: [
    {
      validate: (value: string | undefined) => {
        if (!value) return true; // Optional
        return value.length <= 100;
      },
      message: 'Pinyin must be no more than 100 characters',
    },
  ],
};

/**
 * System rules form validation schema
 */
export const systemRulesFormValidationSchema: ValidationSchema<{
  systemPrompt: string;
}> = {
  systemPrompt: [
    validationRules.maxLength(10000, 'System prompt must be no more than 10000 characters'),
  ],
};

/**
 * Helper to create a validation schema from a base schema with optional overrides
 */
export function createValidationSchema<T extends Record<string, unknown>>(
  baseSchema: ValidationSchema<T>,
  overrides?: Partial<ValidationSchema<T>>
): ValidationSchema<T> {
  return {
    ...baseSchema,
    ...overrides,
  };
}

/**
 * Helper to create conditional validation schemas
 */
export function createConditionalValidationSchema<T extends Record<string, unknown>>(
  condition: boolean,
  schema: ValidationSchema<T>
): ValidationSchema<T> {
  if (!condition) {
    return {} as ValidationSchema<T>;
  }
  return schema;
}
