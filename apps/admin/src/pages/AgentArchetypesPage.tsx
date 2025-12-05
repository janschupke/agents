import { useState } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@openai/ui';
import { AgentArchetypeService } from '../services/agent-archetype.service';
import { AgentArchetype } from '../types/agent-archetype.types';
import {
  AgentArchetypeList,
  AgentArchetypeForm,
} from '../components/agent';
import { IconPlus } from '../components/ui/Icons';
import { queryKeys } from '../hooks/queries/query-keys';
import { AdminPageHeader } from '../components/shared';
import { useDeleteArchetype } from '../hooks/agent';

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

  const deleteMutation = useDeleteArchetype();

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
      <AdminPageHeader
        title={t('archetypes.title')}
        actions={
          !isCreating && !editingArchetype ? (
            <Button onClick={handleCreate} size="sm">
              <IconPlus className="w-4 h-4" />
              {t('archetypes.create')}
            </Button>
          ) : undefined
        }
      />
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
