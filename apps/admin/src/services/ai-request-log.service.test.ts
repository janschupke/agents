import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiRequestLogService } from './ai-request-log.service';
import { apiManager } from './api-manager';
import { API_ENDPOINTS } from '../constants/api.constants';
import type {
  AiRequestLogsResponse,
  GetAiRequestLogsParams,
} from '../types/ai-request-log.types';
import {
  AiRequestLogOrderBy,
  OrderDirection,
} from '../types/ai-request-log.enums';

vi.mock('./api-manager');

describe('AiRequestLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLogs', () => {
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

      vi.mocked(apiManager.get).mockResolvedValue(mockResponse);

      const result = await AiRequestLogService.getLogs();

      expect(apiManager.get).toHaveBeenCalledWith(
        API_ENDPOINTS.AI_REQUEST_LOGS
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch logs with userId param', async () => {
      const params: GetAiRequestLogsParams = {
        userId: 'user_1',
      };
      const mockResponse: AiRequestLogsResponse = {
        logs: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        },
      };

      vi.mocked(apiManager.get).mockResolvedValue(mockResponse);

      const result = await AiRequestLogService.getLogs(params);

      expect(apiManager.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.AI_REQUEST_LOGS}?userId=user_1`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch logs with model param', async () => {
      const params: GetAiRequestLogsParams = {
        model: 'gpt-4',
      };
      const mockResponse: AiRequestLogsResponse = {
        logs: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        },
      };

      vi.mocked(apiManager.get).mockResolvedValue(mockResponse);

      const result = await AiRequestLogService.getLogs(params);

      expect(apiManager.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.AI_REQUEST_LOGS}?model=gpt-4`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch logs with date range params', async () => {
      const params: GetAiRequestLogsParams = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const mockResponse: AiRequestLogsResponse = {
        logs: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        },
      };

      vi.mocked(apiManager.get).mockResolvedValue(mockResponse);

      const result = await AiRequestLogService.getLogs(params);

      expect(apiManager.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.AI_REQUEST_LOGS}?startDate=2024-01-01&endDate=2024-01-31`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch logs with pagination params', async () => {
      const params: GetAiRequestLogsParams = {
        page: 2,
        pageSize: 20,
      };
      const mockResponse: AiRequestLogsResponse = {
        logs: [],
        pagination: {
          page: 2,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        },
      };

      vi.mocked(apiManager.get).mockResolvedValue(mockResponse);

      const result = await AiRequestLogService.getLogs(params);

      expect(apiManager.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.AI_REQUEST_LOGS}?page=2&pageSize=20`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch logs with sorting params', async () => {
      const params: GetAiRequestLogsParams = {
        orderBy: AiRequestLogOrderBy.CREATED_AT,
        orderDirection: OrderDirection.DESC,
      };
      const mockResponse: AiRequestLogsResponse = {
        logs: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
        },
      };

      vi.mocked(apiManager.get).mockResolvedValue(mockResponse);

      const result = await AiRequestLogService.getLogs(params);

      expect(apiManager.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.AI_REQUEST_LOGS}?orderBy=createdAt&orderDirection=desc`
      );
      expect(result).toEqual(mockResponse);
    });

    it('should fetch logs with all params', async () => {
      const params: GetAiRequestLogsParams = {
        userId: 'user_1',
        model: 'gpt-4',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        page: 2,
        pageSize: 20,
        orderBy: AiRequestLogOrderBy.CREATED_AT,
        orderDirection: OrderDirection.DESC,
      };
      const mockResponse: AiRequestLogsResponse = {
        logs: [],
        pagination: {
          page: 2,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        },
      };

      vi.mocked(apiManager.get).mockResolvedValue(mockResponse);

      const result = await AiRequestLogService.getLogs(params);

      const expectedUrl = `${API_ENDPOINTS.AI_REQUEST_LOGS}?userId=user_1&model=gpt-4&startDate=2024-01-01&endDate=2024-01-31&page=2&pageSize=20&orderBy=createdAt&orderDirection=desc`;
      expect(apiManager.get).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(mockResponse);
    });
  });
});
