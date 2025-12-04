import { useState } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentArchetypeService } from '../services/agent-archetype.service';
import { AgentArchetype } from '../types/agent-archetype.types';
import AgentArchetypeList from '../components/AgentArchetypeList';
import { IconPlus } from '../components/ui/Icons';

export default function AgentArchetypesPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingArchetype, setEditingArchetype] = useState<AgentArchetype | null>(null);

  const { data: archetypes = [], isLoading, error } = useQuery({
    queryKey: ['agent-archetypes'],
    queryFn: () => AgentArchetypeService.getAllArchetypes(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => AgentArchetypeService.deleteArchetype(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-archetypes'] });
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
    queryClient.invalidateQueries({ queryKey: ['agent-archetypes'] });
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
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary text-text-inverse rounded-md text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
          >
            <IconPlus className="w-4 h-4" />
            {t('archetypes.create')}
          </button>
        )}
      </div>
      {isCreating || editingArchetype ? (
        <div className="bg-background-secondary rounded-lg p-6 border border-border">
          <p className="text-text-secondary mb-4">
            {t('archetypes.formPlaceholder')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-text-inverse rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              {t('archetypes.save')}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-background text-text-primary border border-border rounded-md text-sm font-medium hover:bg-background-secondary transition-colors"
            >
              {t('archetypes.cancel')}
            </button>
          </div>
        </div>
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
