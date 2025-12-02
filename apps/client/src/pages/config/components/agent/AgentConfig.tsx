import { useState, useEffect, useRef } from 'react';
import { Agent } from '../../../../types/chat.types';
import AgentSidebar from './AgentSidebar';
import AgentConfigForm from './AgentConfigForm';
import { PageContainer } from '../../../../components/ui/layout';
import { useAgents } from '../../../../hooks/queries/use-agents';
import { useAgentSelection } from '../../hooks/use-agent-selection';
import { useAgentConfigOperations } from '../../hooks/use-agent-config-operations';

export default function AgentConfig() {
  const { data: contextAgents = [], isLoading: loadingAgents } = useAgents();
  const [localAgents, setLocalAgents] = useState<Agent[]>([]);
  const hasAutoOpenedRef = useRef(false);

  // Agent selection management
  const { currentAgentId, setCurrentAgentId, agents } = useAgentSelection({
    contextAgents,
    localAgents,
    loadingAgents,
  });

  // Agent operations (create, update, delete)
  const { handleSave, handleDelete, handleNewAgent, saving } =
    useAgentConfigOperations({
      contextAgents,
      localAgents,
      setLocalAgents,
      currentAgentId,
      setCurrentAgentId,
    });

  // Auto-open new agent form when there are no agents
  useEffect(() => {
    if (loadingAgents) {
      return;
    }

    // Use the merged agents array from the selection hook for consistency
    const hasNoAgents = agents.length === 0;
    const currentAgentExists = currentAgentId !== null && agents.some((a) => a.id === currentAgentId);
    
    // If there are no agents, clear any invalid selection and reset the ref
    if (hasNoAgents && currentAgentId !== null && !currentAgentExists) {
      setCurrentAgentId(null);
      hasAutoOpenedRef.current = false;
      return;
    }
    
    // Auto-open form when there are no agents and none is selected (or selected agent doesn't exist)
    if (hasNoAgents && (currentAgentId === null || !currentAgentExists) && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      handleNewAgent();
    }
  }, [loadingAgents, agents, currentAgentId, setCurrentAgentId, handleNewAgent]);

  const handleAgentSelect = (agentId: number) => {
    // Validate agent exists before selecting
    const allAgents = [...contextAgents, ...localAgents];
    if (allAgents.some((a) => a.id === agentId)) {
      setCurrentAgentId(agentId);
    }
  };

  const handleAgentSave = async (
    agent: Agent,
    values: Parameters<typeof handleSave>[1]
  ) => {
    await handleSave(agent, values);
    // Note: handleSave already handles localAgents cleanup and currentAgentId update
  };

  const currentAgent = agents.find((a) => a.id === currentAgentId) || null;

  return (
    <PageContainer>
      <div className="flex h-full">
        <AgentSidebar
          agents={agents}
          currentAgentId={currentAgentId}
          onAgentSelect={handleAgentSelect}
          onNewAgent={handleNewAgent}
          onAgentDelete={handleDelete}
          loading={loadingAgents}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AgentConfigForm
            agent={currentAgent}
            saving={saving}
            onSaveClick={handleAgentSave}
          />
        </div>
      </div>
    </PageContainer>
  );
}
