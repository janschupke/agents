export interface ApiCredentialsStatus {
  provider: string;
  hasKey: boolean;
}

interface ApiCredentialsStatusResponse {
  credentials: ApiCredentialsStatus[];
}
