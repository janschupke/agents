import { useQuery } from '@tanstack/react-query';
import { AgentArchetypeService } from '../../services/agent-archetype/agent-archetype.service';
import { AgentArchetype } from '../../types/agent-archetype.types';
import { queryKeys } from './query-keys';

export function useAgentArchetypes() {
  return useQuery<AgentArchetype[]>({
    queryKey: queryKeys.archetypes.list(),
    queryFn: () => AgentArchetypeService.getAllArchetypes(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
