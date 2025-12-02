import { useState, useCallback, useMemo } from 'react';
import {
  ValidationSchema,
  validateField,
  validateAll,
  ValidationResult,
} from '../validation';

export interface UseFormValidationReturn<T extends Record<string, unknown>> {
  values: T;
  errors: Record<keyof T, string | null>;
  touched: Record<keyof T, boolean>;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  validateField: (field: keyof T) => void;
  validateAll: () => ValidationResult;
  reset: () => void;
  isValid: boolean;
}

export function useFormValidation<T extends Record<string, unknown>>(
  schema: ValidationSchema<T>,
  initialValues: T
): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string | null>>(
    {} as Record<keyof T, string | null>
  );
  const [touched, setTouchedState] = useState<Record<keyof T, boolean>>(
    {} as Record<keyof T, boolean>
  );

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    setErrors((prev) => {
      if (prev[field]) {
        return { ...prev, [field]: null };
      }
      return prev;
    });
  }, []);

  const setTouched = useCallback((field: keyof T, isTouched = true) => {
    setTouchedState((prev) => ({ ...prev, [field]: isTouched }));
  }, []);

  const validateFieldFn = useCallback(
    (field: keyof T) => {
      const rules = schema[field];
      const error = validateField(values[field], rules);
      setErrors((prev) => ({ ...prev, [field]: error }));
      return error === null;
    },
    [schema, values]
  );

  const validateAllFn = useCallback((): ValidationResult => {
    const result = validateAll(values, schema);
    setErrors(result.errors as Record<keyof T, string | null>);
    // Mark all fields as touched when validating all
    const allTouched = Object.keys(schema).reduce(
      (acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      },
      {} as Record<keyof T, boolean>
    );
    setTouchedState((prev) => ({ ...prev, ...allTouched }));
    return result;
  }, [values, schema]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({} as Record<keyof T, string | null>);
    setTouchedState({} as Record<keyof T, boolean>);
  }, [initialValues]);

  const isValid = useMemo(() => {
    return Object.values(errors).every((error) => error === null);
  }, [errors]);

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validateField: validateFieldFn,
    validateAll: validateAllFn,
    reset,
    isValid,
  };
}
