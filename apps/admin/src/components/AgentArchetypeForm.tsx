import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentArchetypeService } from '../services/agent-archetype.service';
import { AgentArchetype } from '../types/agent-archetype.types';
import { queryKeys } from '../hooks/queries/query-keys';
import AgentForm from './AgentForm';
import { AgentFormMode, AgentFormData } from '../types/agent-form.types';
import {
  ResponseLength,
  Gender,
  Sentiment,
  Availability,
} from '../types/agent.types';
import { PersonalityType } from '@openai/shared-types';

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

  const mapArchetypeToFormData = (
    archetype: AgentArchetype | null
  ): AgentFormData | null => {
    if (!archetype) return null;

    const configs = archetype.configs || {};
    return {
      name: archetype.name || '',
      description: archetype.description,
      avatarUrl: archetype.avatarUrl,
      agentType: archetype.agentType,
      language: archetype.language,
      temperature: configs.temperature as number | undefined,
      systemPrompt: (configs.system_prompt as string) || undefined,
      behaviorRules: Array.isArray(configs.behavior_rules)
        ? configs.behavior_rules
        : typeof configs.behavior_rules === 'object' &&
            'rules' in (configs.behavior_rules || {})
          ? (configs.behavior_rules as { rules: string[] })?.rules || []
          : [],
      model: (configs.model as string) || undefined,
      maxTokens: configs.max_tokens as number | undefined,
      responseLength: (configs.response_length as ResponseLength) || undefined,
      age: configs.age as number | undefined,
      gender: (configs.gender as Gender) || undefined,
      personality: (configs.personality as PersonalityType) || undefined,
      sentiment: (configs.sentiment as Sentiment) || undefined,
      interests: (configs.interests as string[]) || undefined,
      availability: (configs.availability as Availability) || undefined,
    };
  };

  const mapFormDataToArchetypeRequest = (
    data: AgentFormData
  ): Parameters<typeof AgentArchetypeService.createArchetype>[0] => {
    const configs: Record<string, unknown> = {};

    if (data.temperature !== undefined) {
      configs.temperature = data.temperature;
    }
    if (data.systemPrompt) {
      configs.system_prompt = data.systemPrompt;
    }
    if (data.behaviorRules && data.behaviorRules.length > 0) {
      configs.behavior_rules = data.behaviorRules;
    }
    if (data.model) {
      configs.model = data.model;
    }
    if (data.maxTokens !== undefined) {
      configs.max_tokens = data.maxTokens;
    }
    if (data.responseLength) {
      configs.response_length = data.responseLength;
    }
    if (data.age !== undefined) {
      configs.age = data.age;
    }
    if (data.gender) {
      configs.gender = data.gender;
    }
    if (data.personality) {
      configs.personality = data.personality;
    }
    if (data.sentiment) {
      configs.sentiment = data.sentiment;
    }
    if (data.interests && data.interests.length > 0) {
      configs.interests = data.interests;
    }
    if (data.availability) {
      configs.availability = data.availability;
    }

    return {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      avatarUrl: data.avatarUrl?.trim() || undefined,
      agentType: data.agentType || undefined,
      language: data.language?.trim() || undefined,
      configs: Object.keys(configs).length > 0 ? configs : undefined,
    };
  };

  const handleSubmit = async (data: AgentFormData) => {
    const requestData = mapFormDataToArchetypeRequest(data);

    if (archetype) {
      updateMutation.mutate({ id: archetype.id, data: requestData });
    } else {
      createMutation.mutate(requestData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <AgentForm
      mode={AgentFormMode.ARCHETYPE}
      initialData={mapArchetypeToFormData(archetype)}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
    />
  );
}
