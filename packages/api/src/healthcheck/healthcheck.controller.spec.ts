import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HealthcheckController } from './healthcheck.controller';
import { HealthcheckService } from './healthcheck.service';

describe('HealthcheckController', () => {
  let controller: HealthcheckController;
  let healthcheckService: HealthcheckService;

  const mockHealthcheckService = {
    check: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthcheckController],
      providers: [
        {
          provide: HealthcheckService,
          useValue: mockHealthcheckService,
        },
      ],
    }).compile();

    controller = module.get<HealthcheckController>(HealthcheckController);
    healthcheckService = module.get<HealthcheckService>(HealthcheckService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check status', async () => {
      const mockHealthStatus = {
        status: 'ok',
        message: 'Health check successful',
        timestamp: new Date().toISOString(),
      };

      mockHealthcheckService.check.mockResolvedValue(mockHealthStatus);

      const result = await controller.check();

      expect(result).toEqual(mockHealthStatus);
      expect(healthcheckService.check).toHaveBeenCalled();
    });

    it('should throw HttpException on service error', async () => {
      const error = new HttpException('Database connection failed', HttpStatus.INTERNAL_SERVER_ERROR);
      mockHealthcheckService.check.mockRejectedValue(error);

      await expect(controller.check()).rejects.toThrow(HttpException);
      await expect(controller.check()).rejects.toThrow('Database connection failed');
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Unknown error');
      mockHealthcheckService.check.mockRejectedValue(error);

      await expect(controller.check()).rejects.toThrow(HttpException);
      await expect(controller.check()).rejects.toThrow('Unknown error');
    });
  });
});
