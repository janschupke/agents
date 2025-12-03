import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for query parameter validation when getting translations
 */
export class GetTranslationsQueryDto {
  @IsString()
  @IsNotEmpty()
  messageIds!: string; // Comma-separated IDs, will be parsed
}

/**
 * DTO for updating a memory
 */
export class UpdateMemoryDto {
  @IsString()
  @IsNotEmpty()
  keyPoint!: string;
}

/**
 * DTO for query parameters in memory endpoints
 */
export class MemoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;
}
