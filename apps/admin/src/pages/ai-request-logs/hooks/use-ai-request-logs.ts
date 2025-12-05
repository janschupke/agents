import { useQuery } from '@tanstack/react-query';
import { AiRequestLogService } from '../../../services/ai-request-log.service';
import type { GetAiRequestLogsParams } from '../../../types/ai-request-log.types';
import { queryKeys } from '../../../hooks/queries/query-keys';

export function useAiRequestLogs(params?: GetAiRequestLogsParams) {
  return useQuery({
    queryKey: queryKeys.aiRequestLogs.list(params),
    queryFn: () => AiRequestLogService.getLogs(params),
  });
}
