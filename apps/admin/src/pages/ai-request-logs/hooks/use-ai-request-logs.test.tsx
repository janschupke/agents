import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAiRequestLogs } from './use-ai-request-logs';
import { AiRequestLogService } from '../../../services/ai-request-log.service';
import { TestQueryProvider } from '../../../test/utils/test-query-provider';
import type {
  AiRequestLogsResponse,
  GetAiRequestLogsParams,
} from '../../../types/ai-request-log.types';

vi.mock('../../../services/ai-request-log.service');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('useAiRequestLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch logs without params', async () => {
    const mockResponse: AiRequestLogsResponse = {
      logs: [],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      },
    };

    vi.mocked(AiRequestLogService.getLogs).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAiRequestLogs(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(AiRequestLogService.getLogs).toHaveBeenCalledWith(undefined);
  });

  it('should fetch logs with params', async () => {
    const params: GetAiRequestLogsParams = {
      userId: 'user_1',
      page: 1,
      pageSize: 20,
    };
    const mockResponse: AiRequestLogsResponse = {
      logs: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
      },
    };

    vi.mocked(AiRequestLogService.getLogs).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAiRequestLogs(params), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(AiRequestLogService.getLogs).toHaveBeenCalledWith(params);
  });

  it('should refetch when params change', async () => {
    const params1: GetAiRequestLogsParams = { userId: 'user_1' };
    const params2: GetAiRequestLogsParams = { userId: 'user_2' };
    const mockResponse: AiRequestLogsResponse = {
      logs: [],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      },
    };

    vi.mocked(AiRequestLogService.getLogs).mockResolvedValue(mockResponse);

    const { result, rerender } = renderHook(
      ({ params }) => useAiRequestLogs(params),
      {
        wrapper,
        initialProps: { params: params1 },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(AiRequestLogService.getLogs).toHaveBeenCalledWith(params1);

    rerender({ params: params2 });

    await waitFor(() => {
      expect(AiRequestLogService.getLogs).toHaveBeenCalledWith(params2);
    });
  });
});
