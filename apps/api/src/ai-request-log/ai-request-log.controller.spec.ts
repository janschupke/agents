import { Test, TestingModule } from '@nestjs/testing';
import { AiRequestLogController } from './ai-request-log.controller';
import { AiRequestLogService } from './ai-request-log.service';
import { GetAiRequestLogsQueryDto } from './dto/ai-request-log.dto';

describe('AiRequestLogController', () => {
  let controller: AiRequestLogController;
  let service: jest.Mocked<AiRequestLogService>;

  const mockService = {
    getAllLogs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiRequestLogController],
      providers: [
        {
          provide: AiRequestLogService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AiRequestLogController>(AiRequestLogController);
    service = module.get(AiRequestLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllLogs', () => {
    it('should return all logs with default options', async () => {
      const query: GetAiRequestLogsQueryDto = {};
      const mockLogs = {
        logs: [],
        pagination: {
          page: 1,
          pageSize: 50,
          total: 0,
          totalPages: 0,
        },
      };

      service.getAllLogs.mockResolvedValue(mockLogs);

      const result = await controller.getAllLogs(query);

      expect(result).toEqual(mockLogs);
      expect(service.getAllLogs).toHaveBeenCalledWith({
        userId: undefined,
        model: undefined,
        startDate: undefined,
        endDate: undefined,
        page: undefined,
        pageSize: undefined,
        orderBy: undefined,
        orderDirection: undefined,
      });
    });

    it('should filter by userId', async () => {
      const query: GetAiRequestLogsQueryDto = {
        userId: 'user-1',
      };
      const mockLogs = {
        logs: [],
        pagination: {
          page: 1,
          pageSize: 50,
          total: 0,
          totalPages: 0,
        },
      };

      service.getAllLogs.mockResolvedValue(mockLogs);

      const result = await controller.getAllLogs(query);

      expect(result).toEqual(mockLogs);
      expect(service.getAllLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
        })
      );
    });

    it('should filter by date range', async () => {
      const query: GetAiRequestLogsQueryDto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const mockLogs = {
        logs: [],
        pagination: {
          page: 1,
          pageSize: 50,
          total: 0,
          totalPages: 0,
        },
      };

      service.getAllLogs.mockResolvedValue(mockLogs);

      const result = await controller.getAllLogs(query);

      expect(result).toEqual(mockLogs);
      expect(service.getAllLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );
    });

    it('should handle pagination', async () => {
      const query: GetAiRequestLogsQueryDto = {
        page: 2,
        pageSize: 20,
      };
      const mockLogs = {
        logs: [],
        pagination: {
          page: 2,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        },
      };

      service.getAllLogs.mockResolvedValue(mockLogs);

      const result = await controller.getAllLogs(query);

      expect(result).toEqual(mockLogs);
      expect(service.getAllLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 20,
        })
      );
    });
  });
});
