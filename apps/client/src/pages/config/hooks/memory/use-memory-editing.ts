import { useState } from 'react';
import { AgentMemory } from '../../../../types/chat.types';

interface UseMemoryEditingReturn {
  editingMemoryId: number | null;
  editValue: string;
  setEditValue: (value: string) => void;
  handleStartEdit: (memory: AgentMemory) => void;
  handleCancelEdit: () => void;
  handleSaveEdit: (
    memoryId: number,
    onEdit: (memoryId: number, newKeyPoint: string) => void
  ) => void;
}

/**
 * Hook to manage memory editing state and operations
 */
export function useMemoryEditing(): UseMemoryEditingReturn {
  const [editingMemoryId, setEditingMemoryId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleStartEdit = (memory: AgentMemory) => {
    setEditingMemoryId(memory.id);
    setEditValue(memory.keyPoint);
  };

  const handleCancelEdit = () => {
    setEditingMemoryId(null);
    setEditValue('');
  };

  const handleSaveEdit = (
    memoryId: number,
    onEdit: (memoryId: number, newKeyPoint: string) => void
  ) => {
    if (editValue.trim()) {
      onEdit(memoryId, editValue.trim());
      setEditingMemoryId(null);
      setEditValue('');
    }
  };

  return {
    editingMemoryId,
    editValue,
    setEditValue,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
  };
}
