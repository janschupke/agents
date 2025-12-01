export class BotConfigDto {
  temperature?: number;
  system_prompt?: string;
  behavior_rules?: string | string[] | { rules: string[] };
  model?: string;
  max_tokens?: number;
}

export class CreateBotDto {
  name: string;
  description?: string;
  avatarUrl?: string;
  configs?: BotConfigDto;
}

export class UpdateBotDto {
  name: string;
  description?: string;
  avatarUrl?: string;
  configs?: BotConfigDto;
}
