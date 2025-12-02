export interface ApiCredentialsStatus {
  provider: string;
  hasKey: boolean;
}

export interface ApiCredentialsStatusResponse {
  credentials: ApiCredentialsStatus[];
}
