import { AgentMemory } from '../../../../../../types/chat.types';
import {
  IconClose,
  SkeletonList,
  Card,
  Button,
} from '@openai/ui';
import { formatRelativeDate } from '@openai/utils';

interface MemoriesListProps {
  memories: AgentMemory[];
  loading: boolean;
  deletingId: number | null;
  onDelete: (memoryId: number) => void;
  onRefresh: () => void;
  agentId: number;
}

export default function MemoriesList({
  memories,
  loading,
  deletingId,
  onDelete,
  onRefresh: _onRefresh,
  agentId,
}: MemoriesListProps) {

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
              <div className="text-sm text-text-primary break-words">
                {memory.keyPoint}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                onClick={() => onDelete(memory.id)}
                disabled={deletingId === memory.id}
                variant="danger"
                size="sm"
                className="w-7 p-0"
                tooltip="Delete"
              >
                <IconClose className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
