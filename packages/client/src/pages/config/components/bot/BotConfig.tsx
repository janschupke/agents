import { useState } from 'react';
import { Agent } from '../../../../types/chat.types';
import BotSidebar from './BotSidebar';
import BotConfigForm from './BotConfigForm';
import { PageContainer } from '../../../../components/ui/layout';
import { useAgents } from '../../../../hooks/queries/use-bots';
import { useAgentSelection } from '../../hooks/use-bot-selection';
import { useAgentConfigOperations } from '../../hooks/use-bot-config-operations';

export default function AgentConfig() {
  const { data: contextAgents = [], isLoading: loadingAgents } = useAgents();
  const [localAgents, setLocalAgents] = useState<Agent[]>([]);

  // Agent selection management
  const { currentAgentId, setCurrentAgentId, agents } = useAgentSelection({
    contextAgents,
    localAgents,
    loadingAgents,
  });

  // Agent operations (create, update, delete)
  const { handleSave, handleDelete, handleNewAgent, saving } = useAgentConfigOperations({
    contextAgents,
    localAgents,
    setLocalAgents,
    currentAgentId,
    setCurrentAgentId,
  });

  const handleAgentSelect = (agentId: number) => {
    // Validate agent exists before selecting
    const allAgents = [...contextAgents, ...localAgents];
    if (allAgents.some((a) => a.id === agentId)) {
      setCurrentAgentId(agentId);
    }
  };

  const handleAgentSave = async (agent: Agent, values: Parameters<typeof handleSave>[1]) => {
    await handleSave(agent, values);
    // Note: handleSave already handles localAgents cleanup and currentAgentId update
  };

  const currentAgent = agents.find((a) => a.id === currentAgentId) || null;

  return (
    <PageContainer>
      <div className="flex h-full">
        <BotSidebar
          agents={agents}
          currentAgentId={currentAgentId}
          onAgentSelect={handleAgentSelect}
          onNewAgent={handleNewAgent}
          onAgentDelete={handleDelete}
          loading={loadingAgents}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <BotConfigForm
            agent={currentAgent}
            saving={saving}
            onSaveClick={handleAgentSave}
          />
        </div>
      </div>
    </PageContainer>
  );
}
