import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentArchetypeService } from '../../../../services/agent-archetype.service';
import { AgentArchetype } from '../../../../types/agent-archetype.types';
import { queryKeys } from '../../../../hooks/queries/query-keys';
import { AgentForm } from './form';
import {
  AgentFormMode,
  AgentFormData,
} from '../../../../types/agent-form.types';
import {
  mapToFormData,
  mapFormDataToArchetypeRequest,
} from '../../hooks/use-agent-form-mapping';

interface AgentArchetypeFormProps {
  archetype: AgentArchetype | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function AgentArchetypeForm({
  archetype,
  onSave,
  onCancel,
}: AgentArchetypeFormProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (
      data: Parameters<typeof AgentArchetypeService.createArchetype>[0]
    ) => AgentArchetypeService.createArchetype(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.archetype.list() });
      onSave();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof AgentArchetypeService.updateArchetype>[1];
    }) => AgentArchetypeService.updateArchetype(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.archetype.list() });
      onSave();
    },
  });

  const handleSubmit = async (data: AgentFormData) => {
    const requestData = mapFormDataToArchetypeRequest(data);

    if (archetype) {
      updateMutation.mutate({
        id: archetype.id,
        data: requestData as Parameters<
          typeof AgentArchetypeService.updateArchetype
        >[1],
      });
    } else {
      createMutation.mutate(requestData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <AgentForm
      mode={AgentFormMode.ARCHETYPE}
      initialData={mapToFormData(archetype)}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
    />
  );
}
