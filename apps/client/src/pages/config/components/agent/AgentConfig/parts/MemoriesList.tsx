import { AgentMemory } from '../../../../types/chat.types';
import {
  IconClose,
  IconEdit,
  SkeletonList,
  Card,
  Button,
  Textarea,
  ButtonVariant,
} from '@openai/ui';
import { formatRelativeDate } from '@openai/utils';
import { useMemoryEditing } from '../../hooks/memory/use-memory-editing';

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
  const {
    editingMemoryId,
    editValue,
    setEditValue,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
  } = useMemoryEditing();

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

  return (
    <div className="space-y-2">
      {memories.map((memory) => (
        <Card key={memory.id} padding="sm" variant="outlined">
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
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-background-secondary border-border focus:ring-2 focus:ring-primary"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSaveEdit(memory.id, onEdit)}
                      disabled={!editValue.trim() || editingId === memory.id}
                      variant={ButtonVariant.PRIMARY}
                      size="sm"
                      loading={editingId === memory.id}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      disabled={editingId === memory.id}
                      variant={ButtonVariant.SECONDARY}
                      size="sm"
                    >
                      Cancel
                    </Button>
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
                <Button
                  onClick={() => handleStartEdit(memory)}
                  disabled={editingId === memory.id || deletingId === memory.id}
                  variant={ButtonVariant.SECONDARY}
                  size="sm"
                  className="w-7 p-0"
                  tooltip="Edit"
                >
                  <IconEdit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onDelete(memory.id)}
                  disabled={deletingId === memory.id || editingId === memory.id}
                  variant={ButtonVariant.DANGER}
                  size="sm"
                  className="w-7 p-0"
                  tooltip="Delete"
                >
                  <IconClose className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
