import { AiRequestLogOrderBy, OrderDirection } from './ai-request-log.enums';

export type LogType = 'MESSAGE' | 'MEMORY' | 'TRANSLATION';

export interface AiRequestLog {
  id: number;
  userId: string | null;
  agentId: number | null;
  logType: LogType;
  requestJson: Record<string, unknown>;
  responseJson: Record<string, unknown>;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedPrice: number;
  createdAt: string;
  user?: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
  agent?: {
    id: number;
    name: string;
    avatarUrl: string | null;
  } | null;
}

export interface AiRequestLogsResponse {
  logs: AiRequestLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface GetAiRequestLogsParams {
  userId?: string;
  model?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  orderBy?: AiRequestLogOrderBy;
  orderDirection?: OrderDirection;
}
