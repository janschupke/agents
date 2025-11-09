import { Embedding } from '../../types/chat.types.js';
import { IconClose } from '../ui/Icons';
import { SkeletonList } from '../ui/Skeleton';

interface EmbeddingsListProps {
  embeddings: Embedding[];
  loading: boolean;
  deletingId: number | null;
  onDelete: (embeddingId: number) => void;
  onRefresh: () => void;
  botId: number;
}

export default function EmbeddingsList({
  embeddings,
  loading,
  deletingId,
  onDelete,
  onRefresh,
  botId,
}: EmbeddingsListProps) {
  if (botId < 0) {
    return (
      <div className="text-text-tertiary text-center py-6 text-sm">
        Save the bot to see embeddings
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

  if (embeddings.length === 0) {
    return (
      <div className="text-text-tertiary text-center py-6 text-sm">
        No embeddings found for this bot
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {embeddings.map((embedding) => (
        <div
          key={embedding.id}
          className="p-3 bg-background border border-border rounded-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-text-tertiary mb-1">
                Session ID: {embedding.sessionId} • Created:{' '}
                {new Date(embedding.createdAt).toLocaleString()}
              </div>
              <div className="text-sm text-text-primary break-words">
                {embedding.chunk}
              </div>
            </div>
            <button
              onClick={() => onDelete(embedding.id)}
              disabled={deletingId === embedding.id}
              className="h-7 px-2.5 text-xs bg-red-600 text-white border-none rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 flex-shrink-0 transition-colors"
              title="Delete"
            >
              <IconClose className="w-3 h-3" />
              {deletingId === embedding.id ? 'Deleting...' : ''}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
