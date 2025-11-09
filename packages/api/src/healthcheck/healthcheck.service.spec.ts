import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { HealthcheckService } from './healthcheck.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthcheckService', () => {
  let service: HealthcheckService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthcheckService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthcheckService>(HealthcheckService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return health check status when database connection is successful', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.check();

      expect(result).toMatchObject({
        status: 'ok',
        message: 'Health check successful',
      });
      expect(result.timestamp).toBeDefined();
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should throw HttpException on database error', async () => {
      const error = new Error('Database connection failed');
      mockPrismaService.$queryRaw.mockRejectedValue(error);

      await expect(service.check()).rejects.toThrow(HttpException);
      await expect(service.check()).rejects.toThrow('Database connection failed');
    });
  });
});
