import { useState } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@openai/ui';
import { AgentArchetypeService } from '../services/agent-archetype.service';
import { AgentArchetype } from '../types/agent-archetype.types';
import AgentArchetypeList from '../components/AgentArchetypeList';
import AgentArchetypeForm from '../components/AgentArchetypeForm';
import { IconPlus } from '../components/ui/Icons';
import { queryKeys } from '../hooks/queries/query-keys';

export default function AgentArchetypesPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingArchetype, setEditingArchetype] =
    useState<AgentArchetype | null>(null);

  const {
    data: archetypes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.archetype.list(),
    queryFn: () => AgentArchetypeService.getAllArchetypes(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => AgentArchetypeService.deleteArchetype(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.archetype.list() });
    },
  });

  const handleCreate = () => {
    setEditingArchetype(null);
    setIsCreating(true);
  };

  const handleEdit = (archetype: AgentArchetype) => {
    setEditingArchetype(archetype);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingArchetype(null);
  };

  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.archetype.list() });
    setIsCreating(false);
    setEditingArchetype(null);
  };

  if (error) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {t('archetypes.error')}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-secondary">
          {t('archetypes.title')}
        </h2>
        {!isCreating && !editingArchetype && (
          <Button onClick={handleCreate} size="sm">
            <IconPlus className="w-4 h-4" />
            {t('archetypes.create')}
          </Button>
        )}
      </div>
      {isCreating || editingArchetype ? (
        <AgentArchetypeForm
          archetype={editingArchetype}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <AgentArchetypeList
          archetypes={archetypes}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
  );
}
