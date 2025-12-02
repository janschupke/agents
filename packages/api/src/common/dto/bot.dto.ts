export class AgentConfigDto {
  temperature?: number;
  system_prompt?: string;
  behavior_rules?: string | string[] | { rules: string[] };
  model?: string;
  max_tokens?: number;
}

export class CreateAgentDto {
  name: string;
  description?: string;
  avatarUrl?: string;
  configs?: AgentConfigDto;
}

export class UpdateAgentDto {
  name: string;
  description?: string;
  avatarUrl?: string;
  configs?: AgentConfigDto;
}
