import { useState } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentMemory } from '../types/agent.types';
import { AgentService } from '../services/agent.service';
import { Button, Card } from '@openai/ui';
import { IconEdit, IconTrash, IconClose } from './ui/Icons';
import { formatRelativeDate } from '@openai/utils';
import { queryKeys } from '../hooks/queries/query-keys';

interface AgentMemoriesListProps {
  agentId: number;
  memories: AgentMemory[];
  loading: boolean;
}

export default function AgentMemoriesList({
  agentId,
  memories,
  loading,
}: AgentMemoriesListProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const updateMutation = useMutation({
    mutationFn: ({ memoryId, keyPoint }: { memoryId: number; keyPoint: string }) =>
      AgentService.updateMemory(agentId, memoryId, { keyPoint }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agent.memories(agentId) });
      setEditingId(null);
      setEditValue('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (memoryId: number) =>
      AgentService.deleteMemory(agentId, memoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agent.memories(agentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.agent.detail(agentId) });
      setDeletingId(null);
    },
  });

  const handleEdit = (memory: AgentMemory) => {
    setEditingId(memory.id);
    setEditValue(memory.keyPoint);
  };

  const handleSave = (memoryId: number) => {
    if (editValue.trim()) {
      updateMutation.mutate({ memoryId, keyPoint: editValue.trim() });
    } else {
      setEditingId(null);
      setEditValue('');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleDelete = (memoryId: number) => {
    if (window.confirm(t('agents.memories.deleteConfirm'))) {
      setDeletingId(memoryId);
      deleteMutation.mutate(memoryId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 w-full bg-background-secondary animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="text-text-tertiary text-center py-6 text-sm">
        {t('agents.memories.empty')}
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
                  <> • {t('agents.memories.session')}: {memory.context.sessionName}</>
                )}
                {memory.context?.sessionId && !memory.context?.sessionName && (
                  <> • {t('agents.memories.session')}: #{memory.context.sessionId}</>
                )}
              </div>
              {editingId === memory.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full p-2 text-sm border border-border rounded bg-background text-text-primary resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSave(memory.id)}
                      disabled={updateMutation.isPending}
                      size="sm"
                      variant="primary"
                    >
                      {t('agents.memories.save')}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      disabled={updateMutation.isPending}
                      size="sm"
                      variant="secondary"
                    >
                      {t('agents.memories.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-text-primary break-words">
                  {memory.keyPoint}
                </div>
              )}
            </div>
            {editingId !== memory.id && (
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  onClick={() => handleEdit(memory)}
                  disabled={deletingId === memory.id}
                  variant="icon"
                  size="sm"
                  className="w-7 p-0"
                  tooltip={t('agents.memories.edit')}
                >
                  <IconEdit className="w-3 h-3" />
                </Button>
                <Button
                  onClick={() => handleDelete(memory.id)}
                  disabled={deletingId === memory.id || updateMutation.isPending}
                  variant="danger"
                  size="sm"
                  className="w-7 p-0"
                  tooltip={t('agents.memories.delete')}
                >
                  <IconTrash className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
