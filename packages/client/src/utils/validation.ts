export type ValidationRule<T = unknown> = {
  validate: (value: T) => boolean;
  message: string;
};

export type ValidationSchema<T extends Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FieldValidationState {
  value: unknown;
  touched: boolean;
  error: string | null;
  isValidating: boolean;
}

/**
 * Validate a single field against rules
 */
export function validateField<T>(
  value: T,
  rules?: ValidationRule<T>[]
): string | null {
  if (!rules || rules.length === 0) {
    return null;
  }

  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }

  return null;
}

/**
 * Validate all fields in a form
 */
export function validateAll<T extends Record<string, unknown>>(
  formData: T,
  schema: ValidationSchema<T>
): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const key in schema) {
    const rules = schema[key];
    if (rules) {
      const error = validateField(formData[key], rules);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
}

/**
 * Create common validation rules
 */
export const validationRules = {
  required: <T>(message = 'This field is required'): ValidationRule<T> => ({
    validate: (value: T) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      return true;
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => value.length <= max,
    message: message || `Must be no more than ${max} characters`,
  }),

  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  url: (message = 'Invalid URL'): ValidationRule<string> => ({
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  number: (message = 'Must be a number'): ValidationRule<string | number> => ({
    validate: (value: string | number) => !isNaN(Number(value)),
    message,
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value >= min,
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value <= max,
    message: message || `Must be no more than ${max}`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value: string) => regex.test(value),
    message,
  }),
};
