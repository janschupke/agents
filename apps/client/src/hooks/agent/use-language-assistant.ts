import { useMemo } from 'react';
import { Agent } from '../../types/chat.types';
import { AgentType } from '../../types/agent.types';

export function useLanguageAssistant(agent: Agent | null | undefined) {
  return useMemo(() => {
    if (!agent) {
      return {
        isLanguageAssistant: false,
        isGeneralAgent: true,
        language: null,
        hasLanguage: false,
      };
    }

    const isLanguageAssistant =
      agent.agentType === AgentType.LANGUAGE_ASSISTANT;
    const isGeneralAgent =
      !agent.agentType || agent.agentType === AgentType.GENERAL;
    const language = agent.language || null;
    const hasLanguage = !!agent.language;

    return {
      isLanguageAssistant,
      isGeneralAgent,
      language,
      hasLanguage,
    };
  }, [agent]);
}
