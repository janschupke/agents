import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateSavedWordDto {
  @IsString()
  @IsNotEmpty()
  originalWord!: string;

  @IsString()
  @IsNotEmpty()
  translation!: string;

  @IsOptional()
  @IsNumber()
  agentId?: number;

  @IsOptional()
  @IsNumber()
  sessionId?: number;

  @IsOptional()
  @IsString()
  sentence?: string;

  @IsOptional()
  @IsNumber()
  messageId?: number;
}

export class UpdateSavedWordDto {
  @IsOptional()
  @IsString()
  translation?: string;

  @IsOptional()
  @IsString()
  pinyin?: string;
}

export class AddSentenceDto {
  @IsString()
  @IsNotEmpty()
  sentence!: string;

  @IsOptional()
  @IsNumber()
  messageId?: number;
}

export class SavedWordResponseDto {
  id!: number;
  originalWord!: string;
  translation!: string;
  pinyin!: string | null;
  agentId!: number | null;
  sessionId!: number | null;
  agentName!: string | null;
  sessionName!: string | null;
  sentences!: SavedWordSentenceResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;
}

export class SavedWordSentenceResponseDto {
  id!: number;
  sentence!: string;
  messageId!: number | null;
  createdAt!: Date;
}

export class SavedWordMatchDto {
  originalWord!: string;
  savedWordId!: number;
  translation!: string;
  pinyin!: string | null;
}
