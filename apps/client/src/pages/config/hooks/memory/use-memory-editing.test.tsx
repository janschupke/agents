import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMemoryEditing } from './use-memory-editing';
import { AgentMemory } from '../../../../types/chat.types';

describe('useMemoryEditing', () => {
  it('should initialize with null editingMemoryId', () => {
    const { result } = renderHook(() => useMemoryEditing());

    expect(result.current.editingMemoryId).toBeNull();
    expect(result.current.editValue).toBe('');
  });

  it('should start editing when handleStartEdit is called', () => {
    const { result } = renderHook(() => useMemoryEditing());
    const memory: AgentMemory = {
      id: 1,
      agentId: 1,
      userId: 'user-1',
      keyPoint: 'Test memory',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    act(() => {
      result.current.handleStartEdit(memory);
    });

    expect(result.current.editingMemoryId).toBe(1);
    expect(result.current.editValue).toBe('Test memory');
  });

  it('should cancel editing when handleCancelEdit is called', () => {
    const { result } = renderHook(() => useMemoryEditing());
    const memory: AgentMemory = {
      id: 1,
      agentId: 1,
      userId: 'user-1',
      keyPoint: 'Test memory',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    act(() => {
      result.current.handleStartEdit(memory);
    });

    expect(result.current.editingMemoryId).toBe(1);

    act(() => {
      result.current.handleCancelEdit();
    });

    expect(result.current.editingMemoryId).toBeNull();
    expect(result.current.editValue).toBe('');
  });

  it('should save edit when handleSaveEdit is called with non-empty value', () => {
    const { result } = renderHook(() => useMemoryEditing());
    const memory: AgentMemory = {
      id: 1,
      agentId: 1,
      userId: 'user-1',
      keyPoint: 'Test memory',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    const mockOnEdit = vi.fn();

    act(() => {
      result.current.handleStartEdit(memory);
    });

    act(() => {
      result.current.setEditValue('Updated memory');
    });

    act(() => {
      result.current.handleSaveEdit(1, mockOnEdit);
    });

    expect(mockOnEdit).toHaveBeenCalledWith(1, 'Updated memory');
    expect(result.current.editingMemoryId).toBeNull();
    expect(result.current.editValue).toBe('');
  });

  it('should not save edit when handleSaveEdit is called with empty value', () => {
    const { result } = renderHook(() => useMemoryEditing());
    const memory: AgentMemory = {
      id: 1,
      agentId: 1,
      userId: 'user-1',
      keyPoint: 'Test memory',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    const mockOnEdit = vi.fn();

    act(() => {
      result.current.handleStartEdit(memory);
    });

    act(() => {
      result.current.setEditValue('   ');
    });

    act(() => {
      result.current.handleSaveEdit(1, mockOnEdit);
    });

    expect(mockOnEdit).not.toHaveBeenCalled();
    expect(result.current.editingMemoryId).toBe(1);
  });

  it('should update editValue when setEditValue is called', () => {
    const { result } = renderHook(() => useMemoryEditing());

    act(() => {
      result.current.setEditValue('New value');
    });

    expect(result.current.editValue).toBe('New value');
  });
});
