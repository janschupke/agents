/**
 * Source types for system prompts
 * Defines where system prompts can originate from
 */
export enum SystemPromptSource {
  MAIN = 'main',
  AGENT_TYPE = 'agentType',
  ARCHETYPE = 'archetype',
}

/**
 * Source types for behavior rules
 * Defines where behavior rules can originate from
 */
export enum BehaviorRulesSource {
  MAIN = 'main',
  AGENT_TYPE = 'agentType',
  ARCHETYPE = 'archetype',
  CLIENT_CONFIG = 'clientConfig',
  CLIENT_USER = 'clientUser',
}
