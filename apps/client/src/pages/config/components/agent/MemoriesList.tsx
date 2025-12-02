import { useState } from 'react';
import { AgentMemory } from '../../../../types/chat.types';
import { IconClose, IconEdit, SkeletonList } from '@openai/ui';
import { formatRelativeDate } from '@openai/utils';

interface MemoriesListProps {
  memories: AgentMemory[];
  loading: boolean;
  editingId: number | null;
  deletingId: number | null;
  onEdit: (memoryId: number, newKeyPoint: string) => void;
  onDelete: (memoryId: number) => void;
  onRefresh: () => void;
  agentId: number;
}

export default function MemoriesList({
  memories,
  loading,
  editingId,
  deletingId,
  onEdit,
  onDelete,
  onRefresh: _onRefresh,
  agentId,
}: MemoriesListProps) {
  const [editingMemoryId, setEditingMemoryId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  if (agentId < 0) {
    return (
      <div className="text-text-tertiary text-center py-6 text-sm">
        Save the agent to see memories
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <SkeletonList count={3} />
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="text-text-tertiary text-center py-6 text-sm">
        No memories found for this agent
      </div>
    );
  }

  const handleStartEdit = (memory: AgentMemory) => {
    setEditingMemoryId(memory.id);
    setEditValue(memory.keyPoint);
  };

  const handleCancelEdit = () => {
    setEditingMemoryId(null);
    setEditValue('');
  };

  const handleSaveEdit = (memoryId: number) => {
    if (editValue.trim()) {
      onEdit(memoryId, editValue.trim());
      setEditingMemoryId(null);
      setEditValue('');
    }
  };

  return (
    <div className="space-y-2">
      {memories.map((memory) => (
        <div
          key={memory.id}
          className="p-3 bg-background border border-border rounded-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-text-tertiary mb-1">
                {formatRelativeDate(memory.createdAt)}
                {memory.context?.sessionName && (
                  <> • Session: {memory.context.sessionName}</>
                )}
                {memory.context?.sessionId && !memory.context?.sessionName && (
                  <> • Session: #{memory.context.sessionId}</>
                )}
              </div>
              {editingMemoryId === memory.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full p-2 text-sm text-text-primary bg-background-secondary border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(memory.id)}
                      disabled={!editValue.trim() || editingId === memory.id}
                      className="h-7 px-2.5 text-xs bg-primary text-white border-none rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {editingId === memory.id ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={editingId === memory.id}
                      className="h-7 px-2.5 text-xs bg-background-tertiary text-text-secondary border border-border rounded-md hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-text-primary break-words">
                  {memory.keyPoint}
                </div>
              )}
            </div>
            {editingMemoryId !== memory.id && (
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => handleStartEdit(memory)}
                  disabled={editingId === memory.id || deletingId === memory.id}
                  className="h-7 w-7 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Edit"
                >
                  <IconEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(memory.id)}
                  disabled={deletingId === memory.id || editingId === memory.id}
                  className="h-7 w-7 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete"
                >
                  <IconClose className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
