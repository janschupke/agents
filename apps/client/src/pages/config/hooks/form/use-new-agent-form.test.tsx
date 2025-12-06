import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNewAgentForm } from './use-new-agent-form';

describe('useNewAgentForm', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useNewAgentForm());

    expect(result.current.formData).toEqual({
      name: '',
      description: null,
      avatarUrl: null,
      agentType: null,
      language: null,
      configs: {
        temperature: 1,
      },
    });
  });

  it('should return hasUnsavedChanges as false for empty form', () => {
    const { result } = renderHook(() => useNewAgentForm());

    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should return hasUnsavedChanges as true when name is set', () => {
    const { result } = renderHook(() => useNewAgentForm());

    act(() => {
      result.current.setFormData({ name: 'Test Agent' });
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('should return hasUnsavedChanges as true when description is set', () => {
    const { result } = renderHook(() => useNewAgentForm());

    act(() => {
      result.current.setFormData({ description: 'Test Description' });
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('should return hasUnsavedChanges as true when avatarUrl is set', () => {
    const { result } = renderHook(() => useNewAgentForm());

    act(() => {
      result.current.setFormData({
        avatarUrl: 'https://example.com/avatar.png',
      });
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('should return hasUnsavedChanges as true when configs are set', () => {
    const { result } = renderHook(() => useNewAgentForm());

    act(() => {
      result.current.setFormData({
        configs: {
          temperature: 1,
        },
      });
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('should update formData correctly', () => {
    const { result } = renderHook(() => useNewAgentForm());

    act(() => {
      result.current.setFormData({
        name: 'New Agent',
        description: 'New Description',
      });
    });

    expect(result.current.formData.name).toBe('New Agent');
    expect(result.current.formData.description).toBe('New Description');
  });
});
