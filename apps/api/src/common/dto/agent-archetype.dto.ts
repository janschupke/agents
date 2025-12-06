import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AgentType,
  ResponseLength,
  Gender,
  Sentiment,
  Availability,
  PersonalityType,
  Language,
  NUMERIC_CONSTANTS,
} from '@openai/shared-types';

export class AgentArchetypeConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(NUMERIC_CONSTANTS.TEMPERATURE_MIN)
  @Max(NUMERIC_CONSTANTS.TEMPERATURE_MAX)
  temperature?: number;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_tokens?: number;

  @IsOptional()
  @IsEnum(ResponseLength)
  response_length?: ResponseLength;

  @IsOptional()
  @IsNumber()
  @Min(NUMERIC_CONSTANTS.AGE_MIN)
  @Max(NUMERIC_CONSTANTS.AGE_MAX)
  age?: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  personality?: PersonalityType;

  @IsOptional()
  @IsEnum(Sentiment)
  sentiment?: Sentiment;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsEnum(Availability)
  availability?: Availability;
}

export class CreateAgentArchetypeDto {
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
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @ValidateNested()
  @Type(() => AgentArchetypeConfigDto)
  configs?: AgentArchetypeConfigDto;
}

export class UpdateAgentArchetypeDto {
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
  @IsEnum(Language)
  language?: Language;

  @IsOptional()
  @ValidateNested()
  @Type(() => AgentArchetypeConfigDto)
  configs?: AgentArchetypeConfigDto;
}

export class AgentArchetypeResponse {
  id!: number;
  name!: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: Language;
  createdAt!: Date;
  updatedAt!: Date;
  configs?: Record<string, unknown>;
}
