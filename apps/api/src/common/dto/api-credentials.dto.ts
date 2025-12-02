import { IsString, IsNotEmpty } from 'class-validator';

export class SetApiKeyDto {
  @IsString()
  @IsNotEmpty()
  apiKey!: string;
}

export class ApiCredentialsStatusItemDto {
  provider!: string;
  hasKey!: boolean;
}

export class ApiCredentialsStatusResponseDto {
  credentials!: ApiCredentialsStatusItemDto[];
}

export class CheckApiKeyResponseDto {
  hasKey!: boolean;
}
