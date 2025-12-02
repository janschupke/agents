import { useEffect, useState, useRef } from 'react';

/**
 * Hook to trigger fade-in animation when a value changes
 * Returns a key that can be used to re-mount components for animation
 */
export function useFadeInOnChange<T>(value: T | null | undefined): number {
  const [fadeKey, setFadeKey] = useState(0);
  const previousValueRef = useRef<T | null | undefined>(null);

  useEffect(() => {
    const currentValue = value ?? null;
    // Trigger fade-in whenever value changes (including when switching back to a previous value)
    if (currentValue !== previousValueRef.current) {
      if (currentValue !== null && currentValue !== undefined) {
        setFadeKey((prev) => prev + 1);
      }
      previousValueRef.current = currentValue;
    }
  }, [value]);

  return fadeKey;
}
