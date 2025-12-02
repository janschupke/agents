export class SetApiKeyDto {
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
