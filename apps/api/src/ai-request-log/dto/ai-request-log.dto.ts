import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AiRequestLogOrderBy,
  OrderDirection,
} from '../constants/ai-request-log.constants';

export class GetAiRequestLogsQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsEnum(AiRequestLogOrderBy)
  orderBy?: AiRequestLogOrderBy;

  @IsOptional()
  @IsEnum(OrderDirection)
  orderDirection?: OrderDirection;
}
