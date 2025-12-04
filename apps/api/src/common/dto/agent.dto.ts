import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  IsEnum,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AgentType } from '../enums/agent-type.enum';

export class AgentConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsString()
  system_prompt?: string;

  @IsOptional()
  behavior_rules?: string | string[] | { rules: string[] };

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_tokens?: number;
}

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(AgentType)
  agentType?: AgentType;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  language?: string; // ISO 639-1 language code (e.g., 'zh', 'en', 'ja')

  @IsOptional()
  @ValidateNested()
  @Type(() => AgentConfigDto)
  configs?: AgentConfigDto;
}

export class UpdateAgentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(AgentType)
  agentType?: AgentType;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  language?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AgentConfigDto)
  configs?: AgentConfigDto;
}
