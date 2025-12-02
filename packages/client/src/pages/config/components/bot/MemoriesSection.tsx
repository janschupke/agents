import { AgentMemory } from '../../../../types/chat.types';
import { IconRefresh } from '../../../../components/ui/Icons';
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-text-secondary">Memories</h3>
        {agentId > 0 && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="h-6 w-6 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh memories"
          >
            <IconRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
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
