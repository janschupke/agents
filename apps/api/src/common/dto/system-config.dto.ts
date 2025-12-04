import { IsOptional, IsArray, IsString } from 'class-validator';

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
