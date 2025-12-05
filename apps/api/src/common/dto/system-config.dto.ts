import { IsOptional, IsArray, IsString, IsEnum } from 'class-validator';
import { AgentType } from '../enums/agent-type.enum';

export class UpdateSystemConfigDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  behavior_rules?: string[];

  @IsOptional()
  @IsString()
  system_prompt?: string;
}

export class SystemBehaviorRulesDto {
  @IsArray()
  @IsString({ each: true })
  rules!: string[];

  @IsOptional()
  @IsString()
  system_prompt?: string;
}

export class SystemBehaviorRulesByAgentTypeDto {
  @IsArray()
  @IsString({ each: true })
  rules!: string[];

  @IsOptional()
  @IsString()
  system_prompt?: string;

  @IsOptional()
  @IsEnum(AgentType)
  agent_type?: AgentType | null;
}
