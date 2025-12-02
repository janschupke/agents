import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFadeInOnChange } from './use-fade-in-on-change';

describe('useFadeInOnChange', () => {
  it('should return 0 initially', () => {
    const { result } = renderHook(() => useFadeInOnChange(null));

    expect(result.current).toBe(0);
  });

  it('should increment key when value changes from null to a value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useFadeInOnChange(value),
      {
        initialProps: { value: null },
      }
    );

    expect(result.current).toBe(0);

    rerender({ value: 'test' });

    expect(result.current).toBe(1);
  });

  it('should increment key when value changes between different values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useFadeInOnChange(value),
      {
        initialProps: { value: 'value1' },
      }
    );

    expect(result.current).toBe(1); // Initial value triggers increment

    rerender({ value: 'value2' });

    expect(result.current).toBe(2);
  });

  it('should increment key when switching back to a previous value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useFadeInOnChange(value),
      {
        initialProps: { value: 'value1' },
      }
    );

    expect(result.current).toBe(1);

    rerender({ value: 'value2' });
    expect(result.current).toBe(2);

    rerender({ value: 'value1' });
    expect(result.current).toBe(3); // Should increment even when going back
  });

  it('should not increment when value changes from value to null', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useFadeInOnChange(value),
      {
        initialProps: { value: 'test' },
      }
    );

    expect(result.current).toBe(1);

    rerender({ value: null });

    // Should not increment when going to null
    expect(result.current).toBe(1);
  });

  it('should not increment when value changes from value to undefined', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useFadeInOnChange(value),
      {
        initialProps: { value: 'test' },
      }
    );

    expect(result.current).toBe(1);

    rerender({ value: undefined });

    // Should not increment when going to undefined
    expect(result.current).toBe(1);
  });

  it('should work with number values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useFadeInOnChange(value),
      {
        initialProps: { value: 1 },
      }
    );

    expect(result.current).toBe(1);

    rerender({ value: 2 });
    expect(result.current).toBe(2);
  });

  it('should work with object values', () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };

    const { result, rerender } = renderHook(
      ({ value }) => useFadeInOnChange(value),
      {
        initialProps: { value: obj1 },
      }
    );

    expect(result.current).toBe(1);

    rerender({ value: obj2 });
    expect(result.current).toBe(2);
  });
});
