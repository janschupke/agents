import { AgentMemory } from '../../../../../../types/chat.types';
import { IconRefresh, SectionHeader } from '@openai/ui';
import MemoriesList from './MemoriesList';

interface MemoriesSectionProps {
  agentId: number;
  memories: AgentMemory[];
  loading: boolean;
  editingId: number | null;
  deletingId: number | null;
  onEdit: (memoryId: number, newKeyPoint: string) => void;
  onDelete: (memoryId: number) => void;
  onRefresh: () => void;
}

/**
 * Section component for displaying and managing agent memories
 */
export default function MemoriesSection({
  agentId,
  memories,
  loading,
  editingId,
  deletingId,
  onEdit,
  onDelete,
  onRefresh,
}: MemoriesSectionProps) {
  return (
    <div>
      <SectionHeader
        title="Memories"
        action={
          agentId > 0
            ? {
                icon: (
                  <IconRefresh
                    className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                  />
                ),
                onClick: onRefresh,
                disabled: loading,
                tooltip: 'Refresh memories',
              }
            : undefined
        }
        className="mb-3"
      />
      <MemoriesList
        memories={memories}
        loading={loading}
        editingId={editingId}
        deletingId={deletingId}
        onEdit={onEdit}
        onDelete={onDelete}
        onRefresh={onRefresh}
        agentId={agentId}
      />
    </div>
  );
}
